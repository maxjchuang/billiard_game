import { describe, expect, it } from 'vitest'

import { ShotResolver } from '../../src/gameplay/flow/ShotResolver'
import { createBall } from '../../src/physics/body/BallBody'
import { PhysicsWorld } from '../../src/physics/PhysicsWorld'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { PhysicsConfig } from '../../src/config/PhysicsConfig'

describe('ShotResolver', () => {
  it('full-power shot hits the rack ball within 1.5s (<=180 steps @120Hz)', () => {
    const logger = new MemoryLogger()
    const resolver = new ShotResolver(logger, PhysicsConfig)

    // Mirrors default in-game spawn positions (see src/game/GameApp.ts)
    const cueBall = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(160, 180) })
    const rackBall = createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(420, 180) })

    resolver.shoot(cueBall, 0, 1)

    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: PhysicsConfig,
      balls: [cueBall, rackBall]
    })

    let firstHitBallId: number | null = null
    for (let i = 0; i < 180; i += 1) {
      const frame = world.step(1 / 120)
      if (frame.firstHitBallId !== null) {
        firstHitBallId = frame.firstHitBallId
        break
      }
    }

    expect(firstHitBallId).toBe(1)
  })

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
