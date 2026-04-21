import { describe, expect, it } from 'vitest'

import { PhysicsWorld } from '../../src/physics/PhysicsWorld'
import { createBall } from '../../src/physics/body/BallBody'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'
import { PhysicsConfig, createRuntimePhysicsConfig } from '../../src/config/PhysicsConfig'

const kineticEnergy = (mass: number, velocity: Vector2): number => 0.5 * mass * velocity.dot(velocity)

const speedMagnitude = (velocity: Vector2): number => velocity.length()

const totalKineticEnergy = (world: PhysicsWorld): number =>
  world.balls.reduce((sum, ball) => sum + kineticEnergy(ball.mass, ball.velocity), 0)

describe('PhysicsWorld', () => {
  it('stops within 0.2s once speed first drops below 0.1px/s', () => {
    const logger = new MemoryLogger()
    const ball = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(200, 200), velocity: new Vector2(0.101, 0) })

    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: {
        ...PhysicsConfig,
        friction: 0.99
      },
      balls: [ball]
    })

    const dt = 1 / 120
    const maxSteps = 24 // 0.2s @ 120Hz
    let firstBelowStep: number | null = null
    let stoppedStep: number | null = null

    for (let i = 0; i < maxSteps; i += 1) {
      world.step(dt)
      const speed = speedMagnitude(ball.velocity)
      if (firstBelowStep === null && speed < 0.1) {
        firstBelowStep = i + 1
      }
      if (stoppedStep === null && speedMagnitude(ball.velocity) === 0) {
        stoppedStep = i + 1
        break
      }
    }

    expect(firstBelowStep).not.toBeNull()
    expect(stoppedStep).not.toBeNull()
    if (firstBelowStep !== null && stoppedStep !== null) {
      expect((stoppedStep - firstBelowStep) * dt).toBeLessThanOrEqual(0.2)
    }
  })

  it('does not force stop when speed is at or above 0.1px/s', () => {
    const logger = new MemoryLogger()
    const ball = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(200, 200), velocity: new Vector2(0.1, 0) })

    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: {
        ...PhysicsConfig,
        friction: 1,
        minVelocity: 0.1
      },
      balls: [ball]
    })

    world.step(1 / 120)
    expect(speedMagnitude(ball.velocity)).toBeGreaterThan(0)
  })

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

  it('tracks distinct object-ball rail contacts during a break frame', () => {
    const logger = new MemoryLogger()
    const solid = createBall({ id: 1, type: 'solid', number: 1, position: new Vector2(10, 120), velocity: new Vector2(-20, 0) })
    const stripe = createBall({ id: 9, type: 'stripe', number: 9, position: new Vector2(320, 350), velocity: new Vector2(0, 20) })
    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: { ...PhysicsConfig, friction: 1, minVelocity: 0 },
      balls: [createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(120, 180) }), solid, stripe]
    })

    const frame = world.step(1 / 30)

    expect(frame.objectBallRailContactIds.sort((a, b) => a - b)).toEqual([1, 9])
  })

  it('pockets balls near inset pocket centers', () => {
    const logger = new MemoryLogger()
    const cueBall = createBall({
      id: 0,
      type: 'cue',
      number: 0,
      // With railThickness=20 and ballRadius=10, this is within 18px of the top-left pocket center (20,20).
      position: new Vector2(30, 30),
      velocity: Vector2.zero()
    })
    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: {
        ...PhysicsConfig,
        friction: 1,
        minVelocity: 0
      },
      balls: [cueBall]
    })

    const frame = world.step(0)
    expect(frame.pocketedBallIds).toEqual([0])
    expect(cueBall.pocketed).toBe(true)
    expect(logger.entries.some((e) => e.scope === 'PhysicsWorld' && e.message === 'ball-pocketed' && e.context?.ballId === 0)).toBe(true)
  })

  it('reports balls that fly off the table', () => {
    const logger = new MemoryLogger()
    const cueBall = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(639, 180), velocity: new Vector2(50, 0) })
    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: { ...PhysicsConfig, friction: 1, minVelocity: 0 },
      balls: [cueBall]
    })

    const frame = world.step(1)

    expect(frame.ballsOffTable).toEqual([0])
  })

  it('applies immediate runtime-config changes without rebuilding the world', () => {
    const logger = new MemoryLogger()
    const runtimeConfig = createRuntimePhysicsConfig()
    runtimeConfig.friction = 1
    runtimeConfig.minVelocity = 0

    const cueBall = createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(200, 200), velocity: new Vector2(10, 0) })
    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: runtimeConfig,
      balls: [cueBall]
    })

    world.step(1 / 120)
    expect(cueBall.velocity.x).toBeCloseTo(10)

    runtimeConfig.friction = 0.5
    world.step(1 / 120)
    expect(cueBall.velocity.x).toBeCloseTo(5, 4)
  })

  it('refreshes cached layout after layout-sensitive parameter changes', () => {
    const logger = new MemoryLogger()
    const runtimeConfig = createRuntimePhysicsConfig()
    const world = new PhysicsWorld({
      width: 640,
      height: 360,
      logger,
      config: runtimeConfig,
      balls: [createBall({ id: 0, type: 'cue', number: 0, position: new Vector2(160, 180) })]
    })

    const before = world.getTableLayout()
    runtimeConfig.railThickness = 28
    runtimeConfig.pocketCaptureRadius = 24
    world.refreshLayout('test-update')
    const after = world.getTableLayout()

    expect(after.feltRect.x).toBe(28)
    expect(after.feltRect.width).toBeLessThan(before.feltRect.width)
    expect(after.pockets[0]?.captureRadius).toBe(24)
    expect(logger.entries.some((entry) => entry.scope === 'PhysicsWorld' && entry.message === 'layout-refreshed')).toBe(true)
  })
})
