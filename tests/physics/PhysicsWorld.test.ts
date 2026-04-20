import { describe, expect, it } from 'vitest'

import { PhysicsWorld } from '../../src/physics/PhysicsWorld'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { PhysicsConfig } from '../../src/config/PhysicsConfig'

const kineticEnergy = (mass: number, velocity: Vector2): number => 0.5 * mass * velocity.dot(velocity)

const totalKineticEnergy = (world: PhysicsWorld): number =>
  world.balls.reduce((sum, ball) => sum + kineticEnergy(ball.mass, ball.velocity), 0)

describe('PhysicsWorld', () => {
  it('does not inject kinetic energy in a two-ball collision', () => {
    const logger = new MemoryLogger()
    const cueBall = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(100, 100), velocity: new Vector2(10, 0) })
    const targetBall = createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(119, 100), velocity: Vector2.zero() })

    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: {
        ...PhysicsConfig,
        friction: 1,
        minVelocity: 0
      },
      balls: [cueBall, targetBall]
    })

    const energyBefore = totalKineticEnergy(world)
    world.step(1 / 120)
    const energyAfter = totalKineticEnergy(world)

    expect(logger.entries.some((entry) => entry.scope === 'PhysicsWorld' && entry.message === 'collision-ball')).toBe(true)
    expect(energyAfter).toBeLessThanOrEqual(energyBefore * 1.02)
  })

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

    expect(totalKineticEnergy(world)).toBeGreaterThan(0)

    expect(firstHitBallId).toBe(1)
    expect(logger.entries.some((entry) => entry.scope === 'PhysicsWorld' && entry.message === 'collision-ball')).toBe(true)
  })
})
