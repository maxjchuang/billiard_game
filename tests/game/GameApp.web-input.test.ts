import { describe, expect, it } from 'vitest'

import { GameApp } from '../../src/game/GameApp'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('GameApp web input gating', () => {
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
})
