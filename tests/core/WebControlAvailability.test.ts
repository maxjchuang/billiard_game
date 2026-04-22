import { describe, expect, it } from 'vitest'

import { GameApp } from '../../src/game/GameApp'
import { getPhysicsHudParameter } from '../game/physicsHudFixtures'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('Web control availability', () => {
  it('returns correct control availability by state', () => {
    const app = new GameApp(new MemoryLogger())

    const bootAvailability = app.debugGetInputAvailability()
    expect(bootAvailability.canStartMatch).toBe(false)

    app.debugBackMenu()
    const menuAvailability = app.debugGetInputAvailability()
    expect(menuAvailability.canStartMatch).toBe(true)
    expect(menuAvailability.canRestart).toBe(false)

    app.startMatch()
    const aimingAvailability = app.debugGetInputAvailability()
    expect(aimingAvailability.canShoot).toBe(true)
    expect(aimingAvailability.canRestart).toBe(true)
    expect(aimingAvailability.canBackMenu).toBe(true)
  })

  it('starts with a collapsed HUD and exposes validation state for parameter drafts', () => {
    const app = new GameApp(new MemoryLogger())

    const initialHudState = app.debugGetPhysicsHudState()
    expect(initialHudState.isOpen).toBe(false)

    app.debugSetPhysicsHudOpen(true)
    app.debugStagePhysicsParameter('friction', '')
    let friction = getPhysicsHudParameter(app, 'friction')
    expect(friction.isValid).toBe(false)
    expect(friction.message).toContain('未生效')

    app.debugStagePhysicsParameter('friction', '0.999')
    friction = getPhysicsHudParameter(app, 'friction')
    expect(friction.isValid).toBe(true)
    expect(app.debugGetPhysicsHudState().isOpen).toBe(true)
  })
})
