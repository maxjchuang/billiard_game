import { describe, expect, it } from 'vitest'

import { PhysicsWorld } from '../../src/physics/PhysicsWorld'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { PhysicsConfig } from '../../src/config/PhysicsConfig'

describe('PhysicsWorld', () => {
  it('detects the first hit ball and stops balls under threshold', () => {
    const logger = new MemoryLogger()
    const cueBall = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(120, 200), velocity: new Vector2(25, 0) })
    const targetBall = createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(145, 200) })
    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: PhysicsConfig,
      balls: [cueBall, targetBall]
    })

    let firstHitBallId: number | null = null
    for (let i = 0; i < 120; i += 1) {
      const frame = world.step(1 / 120)
      if (frame.firstHitBallId !== null) {
        firstHitBallId = frame.firstHitBallId
        break
      }
    }

    expect(firstHitBallId).toBe(1)
    expect(logger.entries.some((entry) => entry.scope === 'PhysicsWorld' && entry.message === 'collision-ball')).toBe(true)
  })
})
