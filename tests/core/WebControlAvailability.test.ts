import { describe, expect, it } from 'vitest'

import { GameApp } from '../../src/game/GameApp'
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
})
