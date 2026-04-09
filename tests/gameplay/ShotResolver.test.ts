import { describe, expect, it } from 'vitest'

import { ShotResolver } from '../../src/gameplay/flow/ShotResolver'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { PhysicsConfig } from '../../src/config/PhysicsConfig'

describe('ShotResolver', () => {
  it('converts aim and power into cue velocity with logs', () => {
    const logger = new MemoryLogger()
    const resolver = new ShotResolver(logger, PhysicsConfig)
    const cueBall = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(0, 0) })

    resolver.shoot(cueBall, 0, 0.5)

    expect(cueBall.velocity.x).toBeCloseTo(PhysicsConfig.maxCueSpeed * 0.5)
    expect(cueBall.velocity.y).toBeCloseTo(0)
    expect(logger.entries.some((entry) => entry.scope === 'ShotResolver' && entry.message === 'shoot')).toBe(true)
  })
})
