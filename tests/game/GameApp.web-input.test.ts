import { describe, expect, it } from 'vitest'

import { GameConfig } from '../../src/config/GameConfig'
import { GameApp } from '../../src/game/GameApp'
import { getPhysicsHudParameter, getPhysicsHudState, stageAndApplyPhysicsParameter } from './physicsHudFixtures'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('GameApp web input gating', () => {
  it('starts and restarts with a legal 16-ball Chinese 8-ball rack', () => {
    const logger = new MemoryLogger()
    const app = new GameApp(logger)

    app.startMatch()
    const initialState = app.debugGetState()

    expect(initialState.balls).toHaveLength(16)
    expect(initialState.balls.filter((ball) => ball.type === 'cue')).toHaveLength(1)
    expect(initialState.balls.filter((ball) => ball.type === 'solid')).toHaveLength(7)
    expect(initialState.balls.filter((ball) => ball.type === 'stripe')).toHaveLength(7)
    expect(initialState.balls.filter((ball) => ball.type === 'black')).toHaveLength(1)

    const blackBall = initialState.balls.find((ball) => ball.id === 8)
    expect(blackBall).toMatchObject({ x: expect.closeTo(GameConfig.rackSpotX + Math.sqrt(3) * 20, 4), y: GameConfig.tableCenterY })

    const rowXs = [...new Set(initialState.balls.filter((ball) => ball.type !== 'cue').map((ball) => Math.round(ball.x)))].sort((a, b) => a - b)
    expect(rowXs).toHaveLength(5)

    app.debugPlaceBall(8, 100, 80)
    app.debugRestartMatch()

    const restartedState = app.debugGetState()
    expect(restartedState.balls).toHaveLength(16)
    expect(restartedState.balls.find((ball) => ball.id === 8)).toMatchObject({
      x: expect.closeTo(GameConfig.rackSpotX + Math.sqrt(3) * 20, 4),
      y: GameConfig.tableCenterY,
      pocketed: false
    })
  })

  it('ignores shoot intent when not in aiming state', () => {
    const logger = new MemoryLogger()
    const app = new GameApp(logger)

    app.startMatch()

    // First shot: valid and transitions to ballsMoving
    app.debugPushIntent({ type: 'shoot', angle: 0.2, power: 0.4 })
    app.step(0.016)

    const movingState = app.debugGetInputAvailability().state

    // While balls are moving, this shoot should be ignored
    app.debugPushIntent({ type: 'shoot', angle: 2.3, power: 1 })
    app.step(0.016)

    const ignored = logger.entries.some((entry) => entry.scope === 'GameApp' && entry.message === 'ignore-shoot-not-aiming')

    expect(movingState).toBe('ballsMoving')
    expect(ignored).toBe(true)
  })

  it('blocks shots until a pending choice is resolved', () => {
    const logger = new MemoryLogger()
    const app = new GameApp(logger)

    app.startMatch()
    app.debugResolveShot({
      firstHitBallId: 1,
      pocketedBallIds: [1, 9],
      cueBallPocketed: false,
      blackBallPocketed: false,
      railHitAfterContact: true,
      foulReasons: [],
      isOpeningBreak: false,
      cueBallStartedBehindBreakLine: true,
      objectBallRailContactIds: [],
      ballsOffTable: []
    })

    app.debugPushIntent({ type: 'shoot', angle: 0.6, power: 0.5 })
    app.step(0.016)

    expect(logger.entries.some((entry) => entry.scope === 'GameApp' && entry.message === 'reject-shoot-pending-decision')).toBe(true)

    app.debugPushIntent({ type: 'choose-group', group: 'solid' })
    app.step(0.016)

    const state = app.debugGetState()
    expect(state.pendingDecisionKind).toBeNull()
    expect(state.playerGroups).toEqual({ p1: 'solid', p2: 'stripe' })
  })

  it('updates supported HUD parameters at runtime and keeps layout in sync', () => {
    const logger = new MemoryLogger()
    const app = new GameApp(logger)
    app.startMatch()

    app.debugSetPhysicsHudOpen(true)
    const frictionResult = stageAndApplyPhysicsParameter(app, 'friction', '1.000')
    const layoutResult = stageAndApplyPhysicsParameter(app, 'railThickness', '28')

    const hudState = getPhysicsHudState(app)
    const tableLayout = app.debugGetTableLayout()

    expect(frictionResult.success).toBe(true)
    expect(layoutResult.success).toBe(true)
    expect(app.debugGetRuntimePhysicsConfig().friction).toBeCloseTo(1)
    expect(app.debugGetRuntimePhysicsConfig().railThickness).toBe(28)
    expect(tableLayout.feltRect.x).toBe(28)
    expect(hudState.modifiedKeys).toEqual(expect.arrayContaining(['friction', 'railThickness']))
    expect(logger.entries.some((entry) => entry.scope === 'GameApp' && entry.message === 'physics-parameter-applied')).toBe(true)
    expect(logger.entries.some((entry) => entry.scope === 'PhysicsWorld' && entry.message === 'layout-refreshed')).toBe(true)
  })

  it('rejects invalid HUD edits without rolling back other applied parameters', () => {
    const realLogger = new MemoryLogger()
    const hudApp = new GameApp(realLogger)
    hudApp.startMatch()
    hudApp.debugSetPhysicsHudOpen(true)

    const validResult = stageAndApplyPhysicsParameter(hudApp, 'ballRestitution', '1.05')
    hudApp.debugStagePhysicsParameter('maxCueSpeed', 'oops')
    const invalidResult = hudApp.debugApplyPhysicsParameter('maxCueSpeed')
    const maxCueSpeed = getPhysicsHudParameter(hudApp, 'maxCueSpeed')

    expect(validResult.success).toBe(true)
    expect(invalidResult.success).toBe(false)
    expect(hudApp.debugGetRuntimePhysicsConfig().ballRestitution).toBeCloseTo(1.05)
    expect(hudApp.debugGetRuntimePhysicsConfig().maxCueSpeed).toBeGreaterThan(0)
    expect(maxCueSpeed.isValid).toBe(false)
    expect(hudApp.debugGetPhysicsHudState().lastError).toContain('未生效')
    expect(realLogger.entries.some((entry) => entry.scope === 'GameApp' && entry.message === 'physics-parameter-rejected')).toBe(true)
  })

  it('resets runtime physics parameters back to defaults and clears dirty state', () => {
    const logger = new MemoryLogger()
    const app = new GameApp(logger)
    app.startMatch()

    stageAndApplyPhysicsParameter(app, 'friction', '1.000')
    stageAndApplyPhysicsParameter(app, 'pocketCaptureRadius', '24')
    expect(getPhysicsHudState(app).hasModifiedValues).toBe(true)

    const resetResult = app.debugResetPhysicsParameters()
    const hudState = getPhysicsHudState(app)
    const friction = getPhysicsHudParameter(app, 'friction')

    expect(resetResult.success).toBe(true)
    expect(hudState.hasModifiedValues).toBe(false)
    expect(hudState.modifiedKeys).toEqual([])
    expect(friction.isDirty).toBe(false)
    expect(app.debugGetRuntimePhysicsConfig().pocketCaptureRadius).toBe(18)
    expect(logger.entries.some((entry) => entry.scope === 'GameApp' && entry.message === 'physics-parameters-reset')).toBe(true)
  })
})
