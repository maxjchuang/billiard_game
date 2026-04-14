import { GameConfig } from '../config/GameConfig'
import { PhysicsConfig } from '../config/PhysicsConfig'
import { StateMachine } from '../core/fsm/StateMachine'
import { FixedStepLoop } from '../core/loop/FixedStepLoop'
import { SceneManager } from '../core/scene/SceneManager'
import { RoundResolver } from '../gameplay/flow/RoundResolver'
import { ShotResolver } from '../gameplay/flow/ShotResolver'
import { RuleEngine } from '../gameplay/rules/RuleEngine'
import { GameSession } from '../gameplay/session/GameSession'
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
    this.sceneManager.setScene(new MatchScene(this.logger), 'match')
    this.stateMachine.transition('aiming', 'match-started')
    this.logger.info('GameApp', 'start-match', { ballCount: balls.length })
  }

  step(deltaTime: number): void {
    this.loop.tick(deltaTime)
  }

  private update(dt: number): void {
    this.sceneManager.update(dt)
    this.consumeInput()

    if (this.stateMachine.current === 'ballsMoving' && this.world && this.session && this.roundResolver) {
      const frame = this.world.step(dt)
      if (frame.allStopped) {
        const cueBallPocketed = frame.pocketedBallIds.includes(0)
        const blackBallPocketed = frame.pocketedBallIds.includes(8)
        this.roundResolver.resolve(this.session, {
          firstHitBallId: frame.firstHitBallId,
          pocketedBallIds: frame.pocketedBallIds,
          cueBallPocketed,
          blackBallPocketed,
          railHitAfterContact: true,
          foulReasons: []
        })

        this.stateMachine.transition(this.session.gameOver ? 'result' : 'aiming', 'balls-stopped')
        if (this.session.gameOver) {
          this.sceneManager.setScene(new ResultScene(this.logger), 'result')
        }
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
    if (!this.renderer) {
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
