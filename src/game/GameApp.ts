import { GameConfig } from '../config/GameConfig'
import { PhysicsConfig } from '../config/PhysicsConfig'
import { StateMachine } from '../core/fsm/StateMachine'
import { FixedStepLoop } from '../core/loop/FixedStepLoop'
import { SceneManager } from '../core/scene/SceneManager'
import { RoundResolver } from '../gameplay/flow/RoundResolver'
import { ShotResolver } from '../gameplay/flow/ShotResolver'
import { RuleEngine } from '../gameplay/rules/RuleEngine'
import { GameSession, type ShotContext } from '../gameplay/session/GameSession'
import { InputManager } from '../input/InputManager'
import { AimController } from '../input/gesture/AimController'
import { PowerController } from '../input/gesture/PowerController'
import { DeviceService } from '../platform/wx/DeviceService'
import { StorageService } from '../platform/wx/StorageService'
import { WxAdapter } from '../platform/wx/WxAdapter'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { createBall } from '../physics/body/BallBody'
import { Vector2 } from '../physics/math/Vector2'
import { Renderer } from '../render/Renderer'
import { RenderConfig } from '../config/RenderConfig'
import type { Logger } from '../shared/logger/Logger'
import { MatchScene } from './scenes/MatchScene'
import { MenuScene } from './scenes/MenuScene'
import { ResultScene } from './scenes/ResultScene'

type AppState = 'boot' | 'menu' | 'aiming' | 'powering' | 'shooting' | 'ballsMoving' | 'roundSettlement' | 'result'

export interface DebugAppState {
  state: AppState
  currentPlayer: 1 | 2 | null
  playerGroups: { p1: string; p2: string } | null
  cueBallInHand: boolean | null
  foul: boolean | null
  foulReasons: string[]
  keepTurn: boolean | null
  gameOver: boolean | null
  winner: 1 | 2 | null
  lastFirstHitBallId: number | null
  lastPocketedBallIds: number[]
  lastAllStopped: boolean | null
  lastShotFirstHitBallId: number | null
  lastShotPocketedBallIds: number[]
  lastShotCueBallPocketed: boolean
  lastShotBlackBallPocketed: boolean
  balls: Array<{ id: number; type: string; x: number; y: number; vx: number; vy: number; pocketed: boolean }>
}

export class GameApp {
  private readonly wxAdapter: WxAdapter
  private readonly sceneManager: SceneManager
  private readonly inputManager: InputManager
  private readonly aimController: AimController
  private readonly powerController: PowerController
  private readonly storageService: StorageService
  private readonly deviceService: DeviceService
  private readonly stateMachine: StateMachine<AppState>
  private readonly loop: FixedStepLoop

  private renderer: Renderer | null = null
  private session: GameSession | null = null
  private world: PhysicsWorld | null = null
  private shotResolver: ShotResolver | null = null
  private roundResolver: RoundResolver | null = null

  private currentShotContext: ShotContext | null = null
  private lastResolvedShotContext: ShotContext | null = null

  private renderEnabled = true
  private paused = false

  constructor(private readonly logger: Logger) {
    this.wxAdapter = new WxAdapter((globalThis as unknown as { wx?: unknown }).wx as any, logger)
    this.sceneManager = new SceneManager(logger)
    this.inputManager = new InputManager(logger)
    this.aimController = new AimController(logger)
    this.powerController = new PowerController(logger)
    this.storageService = new StorageService(logger)
    this.deviceService = new DeviceService(logger)
    this.stateMachine = new StateMachine<AppState>('boot', logger)
    this.loop = new FixedStepLoop(PhysicsConfig.fixedDt, (dt) => this.update(dt), logger)
  }

  boot(): boolean {
    const canvas = this.wxAdapter.createCanvas()
    if (!canvas) {
      this.logger.warn('GameApp', 'boot-skipped-no-canvas')
      return false
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      this.logger.error('GameApp', 'boot-failed-no-context')
      return false
    }

    if (this.wxAdapter.getRuntime() === 'browser') {
      // 浏览器调试：画布尺寸贴合逻辑球桌 + HUD，避免窗口/画布过大
      canvas.width = GameConfig.tableWidth
      canvas.height = GameConfig.tableHeight + RenderConfig.hudHeight
      canvas.style.width = `${canvas.width}px`
      canvas.style.height = `${canvas.height}px`
    } else {
      const systemInfo = this.wxAdapter.getSystemInfo()
      canvas.width = systemInfo.screenWidth
      canvas.height = systemInfo.screenHeight
    }
    this.renderer = new Renderer(ctx, this.logger)
    this.sceneManager.setScene(new MenuScene(this.logger), 'menu')
    this.stateMachine.transition('menu', 'boot-complete')
    this.logger.info('GameApp', 'boot-complete', { width: canvas.width, height: canvas.height })
    return true
  }

  startMatch(): void {
    const balls = [
      createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(160, 180) }),
      createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(420, 180) }),
      createBall({ id: 9, type: 'stripe', number: 9, position: new Vector2(442, 170) }),
      createBall({ id: 8, type: 'black', number: 8, position: new Vector2(442, 192) })
    ]

    this.session = GameSession.createDemoSession(this.logger, balls)
    this.world = new PhysicsWorld({
      width: GameConfig.tableWidth,
      height: GameConfig.tableHeight,
      balls,
      logger: this.logger,
      config: PhysicsConfig
    })
    this.shotResolver = new ShotResolver(this.logger, PhysicsConfig)
    this.roundResolver = new RoundResolver(new RuleEngine(this.logger), this.logger)
    this.resetShotContext()
    this.sceneManager.setScene(new MatchScene(this.logger), 'match')
    this.stateMachine.transition('aiming', 'match-started')
    this.logger.info('GameApp', 'start-match', { ballCount: balls.length })
  }

  private resetShotContext(): void {
    this.currentShotContext = {
      firstHitBallId: null,
      pocketedBallIds: [],
      cueBallPocketed: false,
      blackBallPocketed: false,
      railHitAfterContact: true,
      foulReasons: []
    }
  }

  private accumulateShotFrame(frame: { firstHitBallId: number | null; pocketedBallIds: number[] }): void {
    if (!this.currentShotContext) {
      this.resetShotContext()
    }
    if (!this.currentShotContext) {
      return
    }

    if (this.currentShotContext.firstHitBallId === null && frame.firstHitBallId !== null) {
      this.currentShotContext.firstHitBallId = frame.firstHitBallId
    }

    for (const ballId of frame.pocketedBallIds) {
      if (!this.currentShotContext.pocketedBallIds.includes(ballId)) {
        this.currentShotContext.pocketedBallIds.push(ballId)
      }
    }

    if (this.currentShotContext.pocketedBallIds.includes(0)) {
      this.currentShotContext.cueBallPocketed = true
    }
    if (this.currentShotContext.pocketedBallIds.includes(8)) {
      this.currentShotContext.blackBallPocketed = true
    }
  }

  /**
   * Web Debug/自动化用：显式开始对局
   */
  debugStartMatch(): void {
    this.logger.info('GameApp', 'debug-start-match')
    this.startMatch()
  }

  /**
   * Web Debug/自动化用：直接触发一次出杆
   */
  debugShoot(angle: number, power: number): void {
    if (!this.session || !this.shotResolver) {
      this.logger.warn('GameApp', 'debug-shoot-no-session')
      return
    }

    const cueBall = this.session.getBallById(0)
    if (!cueBall) {
      this.logger.warn('GameApp', 'debug-shoot-no-cue')
      return
    }

    this.aimController.aimAngle = angle
    this.powerController.powerPercent = power
    this.resetShotContext()
    this.shotResolver.shoot(cueBall, angle, power)
    this.stateMachine.transition('ballsMoving', 'debug-shoot')
    this.logger.info('GameApp', 'debug-shoot', { angle, power })
  }

  /**
   * Web Debug/自动化用：直接用 shotContext 执行一次规则结算（绕过物理），用于规则类用例的确定性验证。
   */
  debugResolveShot(shotContext: ShotContext): void {
    if (!this.session || !this.roundResolver) {
      this.logger.warn('GameApp', 'debug-resolve-shot-no-session')
      return
    }

    this.lastResolvedShotContext = shotContext
    this.roundResolver.resolve(this.session, shotContext)
    this.stateMachine.transition(this.session.gameOver ? 'result' : 'aiming', 'debug-resolve-shot')
    if (this.session.gameOver) {
      this.sceneManager.setScene(new ResultScene(this.logger), 'result')
    }

    this.logger.info('GameApp', 'debug-resolve-shot', {
      gameOver: this.session.gameOver,
      winner: this.session.winner
    })
  }

  /** Web Debug/自动化用：重开对局 */
  debugRestartMatch(): void {
    this.logger.info('GameApp', 'debug-restart-match')
    this.startMatch()
  }

  /** Web Debug/自动化用：返回标题页 */
  debugBackMenu(): void {
    this.logger.info('GameApp', 'debug-back-menu')
    this.sceneManager.setScene(new MenuScene(this.logger), 'menu')
    this.stateMachine.transition('menu', 'debug-back-menu')
  }

  /** Web Debug/自动化用：暂停/恢复（用于模拟切后台） */
  debugPause(): void {
    this.paused = true
    this.logger.info('GameApp', 'debug-pause')
  }

  debugResume(): void {
    this.paused = false
    this.logger.info('GameApp', 'debug-resume')
  }

  /** Web Debug/自动化用：启用/禁用渲染（用于长跑压测加速） */
  debugSetRenderEnabled(enabled: boolean): void {
    this.renderEnabled = enabled
    this.logger.info('GameApp', 'debug-render-enabled', { enabled })
  }

  /**
   * Web Debug/自动化用：推进游戏若干步（用于等待物理/结算）
   */
  debugAdvance(steps: number, dtSeconds: number): void {
    const safeSteps = Math.max(0, Math.min(10000, Math.floor(steps)))
    const dt = Math.max(0, Math.min(0.1, dtSeconds))
    for (let i = 0; i < safeSteps; i += 1) {
      this.step(dt)
    }
    this.logger.info('GameApp', 'debug-advance', { steps: safeSteps, dt })
  }

  /**
   * Web Debug/自动化用：直接摆放球（用于构造可复现实验场景）
   */
  debugPlaceBall(ballId: number, x: number, y: number): void {
    if (!this.session) {
      this.logger.warn('GameApp', 'debug-place-ball-no-session')
      return
    }
    const ball = this.session.getBallById(ballId)
    if (!ball) {
      this.logger.warn('GameApp', 'debug-place-ball-not-found', { ballId })
      return
    }
    ball.position = new Vector2(x, y)
    ball.velocity = Vector2.zero()
    ball.active = true
    ball.pocketed = false
    this.logger.info('GameApp', 'debug-place-ball', { ballId, x, y })
  }

  /**
   * Web Debug/自动化用：设置当前玩家分组（仅用于自动化构造合法/非法黑八等场景）
   */
  debugAssignCurrentPlayerGroup(group: 'solid' | 'stripe'): void {
    if (!this.session) {
      this.logger.warn('GameApp', 'debug-assign-group-no-session')
      return
    }
    this.session.assignCurrentPlayerGroup(group)
    this.logger.info('GameApp', 'debug-assign-group', { group })
  }

  /**
   * Web Debug/自动化用：将某一组球标记为全部落袋（仅用于自动化构造场景）
   */
  debugMarkAllGroupPocketed(group: 'solid' | 'stripe'): void {
    if (!this.session) {
      this.logger.warn('GameApp', 'debug-mark-group-no-session')
      return
    }
    const ids = this.session.tableState.balls.filter((b) => b.type === group).map((b) => b.id)
    this.session.markPocketedBallIds(ids)
    this.logger.info('GameApp', 'debug-mark-group-pocketed', { group, ids })
  }

  debugGetState(): DebugAppState {
    const session = this.session
    const world = this.world

    const lastFrame = world?.getLastFrame() ?? { firstHitBallId: null, pocketedBallIds: [], allStopped: true }
    const balls = session?.tableState.balls ?? []
    const foulReasons = session?.lastRoundResult?.foulReasons ?? []
    const lastShot = this.lastResolvedShotContext ?? this.currentShotContext

    return {
      state: this.stateMachine.current,
      currentPlayer: session?.turnState.currentPlayer ?? null,
      playerGroups: session
        ? { p1: session.playerGroups[1], p2: session.playerGroups[2] }
        : null,
      cueBallInHand: session?.turnState.cueBallInHand ?? null,
      foul: session?.turnState.foul ?? null,
      foulReasons,
      keepTurn: session?.turnState.keepTurn ?? null,
      gameOver: session?.gameOver ?? null,
      winner: session?.winner ?? null,
      lastFirstHitBallId: lastFrame.firstHitBallId,
      lastPocketedBallIds: lastFrame.pocketedBallIds,
      lastAllStopped: world ? lastFrame.allStopped : null,
      lastShotFirstHitBallId: lastShot?.firstHitBallId ?? null,
      lastShotPocketedBallIds: lastShot?.pocketedBallIds ?? [],
      lastShotCueBallPocketed: Boolean(lastShot?.cueBallPocketed),
      lastShotBlackBallPocketed: Boolean(lastShot?.blackBallPocketed),
      balls: balls.map((b) => ({
        id: b.id,
        type: b.type,
        x: b.position.x,
        y: b.position.y,
        vx: b.velocity.x,
        vy: b.velocity.y,
        pocketed: b.pocketed
      }))
    }
  }

  step(deltaTime: number): void {
    this.loop.tick(deltaTime)
  }

  private update(dt: number): void {
    if (this.paused) {
      return
    }
    this.sceneManager.update(dt)
    this.consumeInput()

    if (this.stateMachine.current === 'ballsMoving' && this.world && this.session && this.roundResolver) {
      const frame = this.world.step(dt)
      this.accumulateShotFrame(frame)
      if (frame.allStopped) {
        const shotContext = this.currentShotContext ?? {
          firstHitBallId: frame.firstHitBallId,
          pocketedBallIds: frame.pocketedBallIds,
          cueBallPocketed: frame.pocketedBallIds.includes(0),
          blackBallPocketed: frame.pocketedBallIds.includes(8),
          railHitAfterContact: true,
          foulReasons: []
        }

        this.lastResolvedShotContext = shotContext
        this.roundResolver.resolve(this.session, shotContext)

        this.stateMachine.transition(this.session.gameOver ? 'result' : 'aiming', 'balls-stopped')
        if (this.session.gameOver) {
          this.sceneManager.setScene(new ResultScene(this.logger), 'result')
        }

        this.resetShotContext()
      }
    }

    this.render()
  }

  private consumeInput(): void {
    const intents = this.inputManager.drainIntents()
    for (const intent of intents) {
      if (intent.type === 'start-match') {
        this.startMatch()
        continue
      }

      if (intent.type === 'shoot' && this.session && this.shotResolver) {
        const cueBall = this.session.getBallById(0)
        if (!cueBall) {
          continue
        }
        this.aimController.aimAngle = intent.angle
        this.powerController.powerPercent = intent.power
        this.resetShotContext()
        this.shotResolver.shoot(cueBall, intent.angle, intent.power)
        this.stateMachine.transition('ballsMoving', 'player-shoot')
        this.deviceService.vibrateShort()
      }

      if (intent.type === 'restart-match') {
        this.startMatch()
      }

      if (intent.type === 'back-menu') {
        this.sceneManager.setScene(new MenuScene(this.logger), 'menu')
        this.stateMachine.transition('menu', 'back-menu')
      }
    }
  }

  private render(): void {
    if (!this.renderer || !this.renderEnabled) {
      return
    }

    const cueBallPosition = this.session?.getBallById(0)?.position ?? new Vector2(160, 180)
    this.renderer.render({
      width: GameConfig.tableWidth,
      height: GameConfig.tableHeight,
      balls: this.session?.tableState.balls ?? [],
      cueBallPosition,
      aimAngle: this.aimController.aimAngle,
      title: GameConfig.title,
      subtitle: `state=${this.stateMachine.current}`
    })
    this.sceneManager.render()
  }
}
