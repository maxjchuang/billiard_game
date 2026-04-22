import { GameConfig } from '../config/GameConfig'
import {
  PhysicsConfig,
  buildPhysicsApplySuccessMessage,
  createPhysicsParameterDraftState,
  createRuntimePhysicsConfig,
  createRuntimePhysicsDiagnostics,
  formatPhysicsParameterValue,
  getPhysicsParameterDescriptor,
  getPhysicsParameterDescriptors,
  hasLayoutRefreshPhysicsChanges,
  isPhysicsConfigAtDefaults,
  listModifiedPhysicsParameterKeys,
  parsePhysicsParameterValue,
  type PhysicsConfigApplyEvent,
  type PhysicsHudSnapshot,
  type PhysicsParameterDraftState,
  type PhysicsParameterKey,
  type RuntimePhysicsConfig,
  type RuntimePhysicsDiagnostics
} from '../config/PhysicsConfig'
import { StateMachine } from '../core/fsm/StateMachine'
import { FixedStepLoop } from '../core/loop/FixedStepLoop'
import { SceneManager } from '../core/scene/SceneManager'
import { RoundResolver } from '../gameplay/flow/RoundResolver'
import { ShotResolver } from '../gameplay/flow/ShotResolver'
import { RuleEngine } from '../gameplay/rules/RuleEngine'
import { GameSession, type ShotContext } from '../gameplay/session/GameSession'
import { createChineseEightBallRack } from '../gameplay/session/createChineseEightBallRack'
import { InputManager, type InputIntent } from '../input/InputManager'
import { AimController } from '../input/gesture/AimController'
import { PowerController } from '../input/gesture/PowerController'
import { DeviceService } from '../platform/wx/DeviceService'
import { StorageService } from '../platform/wx/StorageService'
import { WxAdapter } from '../platform/wx/WxAdapter'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { Vector2 } from '../physics/math/Vector2'
import { Renderer } from '../render/Renderer'
import { RenderConfig } from '../config/RenderConfig'
import { computeTableLayout, type TableLayout } from '../shared/TableLayout'
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
  pendingDecisionKind: string | null
  pendingDecisionOptions: string[]
  runtimePhysics: RuntimePhysicsConfig
  physicsDiagnostics: RuntimePhysicsDiagnostics
  physicsHudOpen: boolean
  physicsHudStatus: string
  physicsHudModifiedKeys: PhysicsParameterKey[]
  balls: Array<{ id: number; type: string; x: number; y: number; vx: number; vy: number; pocketed: boolean }>
}

export interface WebInputAvailability {
  state: AppState
  canShoot: boolean
  canStartMatch: boolean
  canRestart: boolean
  canBackMenu: boolean
  breakOptionActions: Array<'break-option-behind-line-ball-in-hand' | 'break-option-re-rack' | 'break-option-accept-table'>
  groupSelectionActions: Array<'group-solid' | 'group-stripe'>
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
  private readonly runtimePhysicsConfig: RuntimePhysicsConfig
  private readonly runtimePhysicsDiagnostics: RuntimePhysicsDiagnostics
  private readonly physicsHudDrafts: Record<PhysicsParameterKey, PhysicsParameterDraftState>
  private physicsHudOpen = RenderConfig.physicsHudDefaultOpen
  private physicsHudLastAppliedAt: number | null = null
  private physicsHudLastError: string | null = null
  private physicsHudLastStatus = '准备就绪'
  private physicsHudApplySequence = 0

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
    this.runtimePhysicsConfig = createRuntimePhysicsConfig()
    this.runtimePhysicsDiagnostics = createRuntimePhysicsDiagnostics()
    this.physicsHudDrafts = this.createInitialPhysicsHudDrafts()
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
    const balls = createChineseEightBallRack()

    this.session = GameSession.createDemoSession(this.logger, balls)
    this.world = new PhysicsWorld({
      width: GameConfig.tableWidth,
      height: GameConfig.tableHeight,
      balls,
      logger: this.logger,
      config: this.runtimePhysicsConfig
    })
    this.shotResolver = new ShotResolver(this.logger, this.runtimePhysicsConfig)
    this.roundResolver = new RoundResolver(new RuleEngine(this.logger), this.logger)
    this.resetShotContext()
    this.sceneManager.setScene(new MatchScene(this.logger), 'match')
    this.stateMachine.transition('aiming', 'match-started')
    this.logger.info('GameApp', 'start-match', { ballCount: balls.length })
  }

  private resetShotContext(): void {
    const cueBall = this.session?.getBallById(0)
    this.currentShotContext = {
      firstHitBallId: null,
      pocketedBallIds: [],
      cueBallPocketed: false,
      blackBallPocketed: false,
      railHitAfterContact: true,
      foulReasons: [],
      isOpeningBreak: this.session?.tableState.shotCount === 0,
      cueBallStartedBehindBreakLine: cueBall ? cueBall.position.x <= GameConfig.breakLineX : true,
      objectBallRailContactIds: [],
      ballsOffTable: []
    }
  }

  private accumulateShotFrame(frame: {
    firstHitBallId: number | null
    pocketedBallIds: number[]
    objectBallRailContactIds: number[]
    ballsOffTable: number[]
  }): void {
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

    for (const ballId of frame.objectBallRailContactIds) {
      if (!this.currentShotContext.objectBallRailContactIds.includes(ballId)) {
        this.currentShotContext.objectBallRailContactIds.push(ballId)
      }
    }

    for (const ballId of frame.ballsOffTable) {
      if (!this.currentShotContext.ballsOffTable.includes(ballId)) {
        this.currentShotContext.ballsOffTable.push(ballId)
      }
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

    if (this.session.pendingDecision) {
      this.logger.warn('GameApp', 'reject-shoot-pending-decision', {
        kind: this.session.pendingDecision.kind,
        source: 'debug'
      })
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

  debugChooseBreakFoulOption(option: 'behind-line-ball-in-hand' | 're-rack' | 'accept-table'): void {
    this.debugPushIntent({ type: 'choose-break-foul-option', option })
  }

  debugChooseGroup(group: 'solid' | 'stripe'): void {
    this.debugPushIntent({ type: 'choose-group', group })
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
    const physicsHudState = this.debugGetPhysicsHudState()

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
      pendingDecisionKind: session?.pendingDecision?.kind ?? null,
      pendingDecisionOptions: session?.pendingDecision?.options ?? [],
      runtimePhysics: { ...this.runtimePhysicsConfig },
      physicsDiagnostics: { ...this.runtimePhysicsDiagnostics },
      physicsHudOpen: physicsHudState.isOpen,
      physicsHudStatus: physicsHudState.lastStatus,
      physicsHudModifiedKeys: [...physicsHudState.modifiedKeys],
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

  debugGetInputAvailability(): WebInputAvailability {
    const state = this.stateMachine.current
    const pendingDecision = this.session?.pendingDecision
    return {
      state,
      canShoot: state === 'aiming' && Boolean(this.session && this.shotResolver) && !pendingDecision,
      canStartMatch: state === 'menu',
      canRestart: state === 'aiming' || state === 'ballsMoving' || state === 'result',
      canBackMenu: state !== 'menu' && state !== 'boot',
      breakOptionActions: pendingDecision?.kind === 'break-foul-option'
        ? [
          'break-option-behind-line-ball-in-hand',
          'break-option-re-rack',
          'break-option-accept-table'
        ]
        : [],
      groupSelectionActions: pendingDecision?.kind === 'group-selection'
        ? ['group-solid', 'group-stripe']
        : []
    }
  }

  debugPreviewShot(angle: number, power: number): void {
    if (this.stateMachine.current !== 'aiming' || !this.session) {
      return
    }
    this.aimController.aimAngle = angle
    this.powerController.powerPercent = Math.max(0, Math.min(1, power))
    this.logger.info('GameApp', 'debug-preview-shot', { angle, power: this.powerController.powerPercent })
  }

  debugSetPhysicsHudOpen(isOpen: boolean): void {
    this.physicsHudOpen = isOpen
    this.logger.info('GameApp', 'physics-hud-open-changed', { isOpen })
  }

  debugTogglePhysicsHud(): void {
    this.debugSetPhysicsHudOpen(!this.physicsHudOpen)
  }

  debugStagePhysicsParameter(key: PhysicsParameterKey, valueText: string): PhysicsParameterDraftState {
    const parsed = parsePhysicsParameterValue(key, valueText)
    const nextDraft: PhysicsParameterDraftState = {
      valueText,
      parsedValue: parsed.parsedValue,
      isDirty: this.runtimePhysicsConfig[key] !== getPhysicsParameterDescriptor(key).defaultValue,
      isValid: parsed.isValid,
      message: parsed.message
    }

    this.physicsHudDrafts[key] = nextDraft
    return nextDraft
  }

  debugApplyPhysicsParameter(key: PhysicsParameterKey): PhysicsConfigApplyEvent {
    const draft = this.physicsHudDrafts[key]
    const descriptor = getPhysicsParameterDescriptor(key)
    if (!draft.isValid || draft.parsedValue === null) {
      const reason = draft.message ?? `${descriptor.label}未生效`
      this.physicsHudLastError = reason
      this.physicsHudLastStatus = reason
      this.logger.warn('GameApp', 'physics-parameter-rejected', {
        key,
        valueText: draft.valueText,
        reason,
        applyMode: descriptor.applyMode
      })
      return {
        parameterKey: key,
        requestedValue: draft.valueText,
        appliedValue: null,
        success: false,
        reason,
        applyMode: descriptor.applyMode
      }
    }

    this.runtimePhysicsConfig[key] = draft.parsedValue
    if (descriptor.applyMode === 'layout-refresh') {
      this.refreshWorldLayout(`parameter:${key}`)
    }

    const message = buildPhysicsApplySuccessMessage(key, draft.parsedValue)
    this.physicsHudApplySequence += 1
    this.physicsHudLastAppliedAt = this.physicsHudApplySequence
    this.physicsHudLastError = null
    this.physicsHudLastStatus = message
    this.physicsHudDrafts[key] = createPhysicsParameterDraftState(key, this.runtimePhysicsConfig, message)

    this.logger.info('GameApp', 'physics-parameter-applied', {
      key,
      appliedValue: draft.parsedValue,
      applyMode: descriptor.applyMode
    })

    return {
      parameterKey: key,
      requestedValue: draft.valueText,
      appliedValue: draft.parsedValue,
      success: true,
      reason: message,
      applyMode: descriptor.applyMode
    }
  }

  debugResetPhysicsParameters(): PhysicsConfigApplyEvent {
    const modifiedKeys = listModifiedPhysicsParameterKeys(this.runtimePhysicsConfig)
    for (const descriptor of getPhysicsParameterDescriptors()) {
      this.runtimePhysicsConfig[descriptor.key] = descriptor.defaultValue
      this.physicsHudDrafts[descriptor.key] = createPhysicsParameterDraftState(descriptor.key, this.runtimePhysicsConfig)
    }

    if (hasLayoutRefreshPhysicsChanges(modifiedKeys)) {
      this.refreshWorldLayout('reset-all')
    }

    this.physicsHudApplySequence += 1
    this.physicsHudLastAppliedAt = this.physicsHudApplySequence
    this.physicsHudLastError = null
    this.physicsHudLastStatus = '已恢复默认物理参数'

    this.logger.info('GameApp', 'physics-parameters-reset', {
      modifiedKeys,
      refreshedLayout: hasLayoutRefreshPhysicsChanges(modifiedKeys)
    })

    return {
      parameterKey: 'reset-all',
      requestedValue: modifiedKeys.length,
      appliedValue: modifiedKeys.length,
      success: true,
      reason: this.physicsHudLastStatus,
      applyMode: 'reset'
    }
  }

  debugGetPhysicsHudState(): PhysicsHudSnapshot {
    const modifiedKeys = listModifiedPhysicsParameterKeys(this.runtimePhysicsConfig)
    return {
      isOpen: this.physicsHudOpen,
      parameters: getPhysicsParameterDescriptors().map((descriptor) => {
        const draft = this.physicsHudDrafts[descriptor.key]
        return {
          ...descriptor,
          currentValue: this.runtimePhysicsConfig[descriptor.key],
          valueText: draft.valueText,
          parsedValue: draft.parsedValue,
          isDirty: this.runtimePhysicsConfig[descriptor.key] !== descriptor.defaultValue,
          isValid: draft.isValid,
          message: draft.message
        }
      }),
      diagnostics: { ...this.runtimePhysicsDiagnostics },
      hasModifiedValues: !isPhysicsConfigAtDefaults(this.runtimePhysicsConfig),
      modifiedKeys,
      lastAppliedAt: this.physicsHudLastAppliedAt,
      lastError: this.physicsHudLastError,
      lastStatus: this.physicsHudLastStatus
    }
  }

  debugGetRuntimePhysicsConfig(): RuntimePhysicsConfig {
    return { ...this.runtimePhysicsConfig }
  }

  debugGetPhysicsDiagnostics(): RuntimePhysicsDiagnostics {
    return { ...this.runtimePhysicsDiagnostics }
  }

  debugGetTableLayout(): TableLayout {
    return this.getRenderTableLayout()
  }

  debugCancelShot(): void {
    this.powerController.powerPercent = 0
    this.logger.info('GameApp', 'debug-cancel-shot')
  }

  debugPushIntent(intent: InputIntent): void {
    this.inputManager.pushIntent(intent)
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
          foulReasons: [],
          isOpeningBreak: this.session.tableState.shotCount === 0,
          cueBallStartedBehindBreakLine: true,
          objectBallRailContactIds: frame.objectBallRailContactIds,
          ballsOffTable: frame.ballsOffTable
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
        if (this.stateMachine.current !== 'menu') {
          this.logger.info('GameApp', 'ignore-start-match', { state: this.stateMachine.current })
          continue
        }
        this.startMatch()
        continue
      }

      if (intent.type === 'preview-shot' && this.session) {
        this.debugPreviewShot(intent.angle, intent.power)
        continue
      }

      if (intent.type === 'cancel-shot') {
        this.debugCancelShot()
        continue
      }

      if (intent.type === 'shoot' && this.session && this.shotResolver) {
        if (this.stateMachine.current !== 'aiming') {
          this.logger.info('GameApp', 'ignore-shoot-not-aiming', { state: this.stateMachine.current })
          continue
        }
        if (this.session.pendingDecision) {
          this.logger.warn('GameApp', 'reject-shoot-pending-decision', {
            kind: this.session.pendingDecision.kind
          })
          continue
        }
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

      if (intent.type === 'choose-break-foul-option') {
        if (!this.session || this.session.pendingDecision?.kind !== 'break-foul-option') {
          this.logger.warn('GameApp', 'reject-break-option', { option: intent.option })
          continue
        }
        const resolution = this.session.resolvePendingDecision(intent.option)
        if (!resolution) {
          this.logger.warn('GameApp', 'reject-break-option', { option: intent.option, reason: 'resolution-failed' })
          continue
        }
        if (resolution.restartRack) {
          this.logger.info('GameApp', 'break-option-rerack', { option: intent.option })
          this.startMatch()
          continue
        }
        this.logger.info('GameApp', 'break-option-resolved', { option: intent.option })
        continue
      }

      if (intent.type === 'choose-group') {
        if (!this.session || this.session.pendingDecision?.kind !== 'group-selection') {
          this.logger.warn('GameApp', 'reject-group-choice', { group: intent.group })
          continue
        }
        const resolution = this.session.resolvePendingDecision(intent.group)
        if (!resolution) {
          this.logger.warn('GameApp', 'reject-group-choice', { group: intent.group, reason: 'resolution-failed' })
          continue
        }
        this.logger.info('GameApp', 'group-choice-resolved', { group: intent.group })
        continue
      }

      if (intent.type === 'restart-match') {
        if (this.stateMachine.current === 'boot' || this.stateMachine.current === 'menu') {
          this.logger.info('GameApp', 'ignore-restart-match', { state: this.stateMachine.current })
          continue
        }
        this.startMatch()
      }

      if (intent.type === 'back-menu') {
        if (this.stateMachine.current === 'boot' || this.stateMachine.current === 'menu') {
          continue
        }
        this.sceneManager.setScene(new MenuScene(this.logger), 'menu')
        this.stateMachine.transition('menu', 'back-menu')
      }
    }
  }

  private createInitialPhysicsHudDrafts(): Record<PhysicsParameterKey, PhysicsParameterDraftState> {
    const drafts = {} as Record<PhysicsParameterKey, PhysicsParameterDraftState>
    for (const descriptor of getPhysicsParameterDescriptors()) {
      drafts[descriptor.key] = createPhysicsParameterDraftState(descriptor.key, this.runtimePhysicsConfig)
    }
    return drafts
  }

  private refreshWorldLayout(reason: string): void {
    if (!this.world) {
      return
    }
    this.world.refreshLayout(reason)
    this.logger.info('GameApp', 'physics-layout-refresh', {
      reason,
      railThickness: this.runtimePhysicsConfig.railThickness,
      pocketCaptureRadius: this.runtimePhysicsConfig.pocketCaptureRadius
    })
  }

  private getRenderTableLayout(): TableLayout {
    return this.world?.getTableLayout() ?? computeTableLayout({
      width: GameConfig.tableWidth,
      height: GameConfig.tableHeight,
      railThickness: this.runtimePhysicsConfig.railThickness,
      pocketCaptureRadius: this.runtimePhysicsConfig.pocketCaptureRadius,
      pocketVisualRadius: this.runtimePhysicsConfig.pocketCaptureRadius
    })
  }

  private render(): void {
    if (!this.renderer || !this.renderEnabled) {
      return
    }

    const cueBallPosition = this.session?.getBallById(0)?.position ?? new Vector2(160, 180)
    const hudState = this.debugGetPhysicsHudState()
    const modifiedSummary = hudState.hasModifiedValues
      ? `physics=${hudState.modifiedKeys.length} modified`
      : 'physics=defaults'
    const detail = hudState.hasModifiedValues
      ? `modified=${hudState.modifiedKeys.map((key) => `${key}:${formatPhysicsParameterValue(key, this.runtimePhysicsConfig[key])}`).join(', ')}`
      : `fixedDt=${this.runtimePhysicsDiagnostics.fixedDt.toFixed(4)} status=${hudState.lastStatus}`
    this.renderer.render({
      width: GameConfig.tableWidth,
      height: GameConfig.tableHeight,
      balls: this.session?.tableState.balls ?? [],
      cueBallPosition,
      aimAngle: this.aimController.aimAngle,
      tableLayout: this.getRenderTableLayout(),
      title: GameConfig.title,
      subtitle: `state=${this.stateMachine.current} power=${this.powerController.powerPercent.toFixed(2)} ${modifiedSummary}`,
      detail
    })
    this.sceneManager.render()
  }
}
