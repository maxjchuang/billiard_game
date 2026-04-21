import { PhysicsConfig, type PhysicsConfigShape } from '../config/PhysicsConfig'
import type { BallBody } from './body/BallBody'
import { Vector2 } from './math/Vector2'
import type { Logger } from '../shared/logger/Logger'
import { computeTableLayout, type TableLayout } from '../shared/TableLayout'

export interface TableDimensions {
  width: number
  height: number
}

export interface PhysicsFrameResult {
  firstHitBallId: number | null
  pocketedBallIds: number[]
  allStopped: boolean
}

interface Pocket {
  center: Vector2
  captureRadius: number
}

interface PhysicsWorldOptions extends TableDimensions {
  balls: BallBody[]
  logger: Logger
  config?: PhysicsConfigShape
}

export class PhysicsWorld {
  private readonly pockets: Pocket[]
  private readonly layout: TableLayout
  private readonly config: PhysicsConfigShape
  private lastFrame: PhysicsFrameResult = { firstHitBallId: null, pocketedBallIds: [], allStopped: true }

  constructor(private readonly options: PhysicsWorldOptions) {
    this.config = options.config ?? PhysicsConfig
    this.layout = computeTableLayout({
      width: options.width,
      height: options.height,
      railThickness: this.config.railThickness,
      pocketCaptureRadius: this.config.pocketCaptureRadius
    })
    this.pockets = this.layout.pockets.map((pocket) => ({
      center: new Vector2(pocket.center.x, pocket.center.y),
      captureRadius: pocket.captureRadius
    }))

    this.options.logger.info('PhysicsWorld', 'init', {
      width: options.width,
      height: options.height,
      railThickness: this.config.railThickness,
      ballCount: options.balls.length
    })
  }

  get balls(): BallBody[] {
    return this.options.balls
  }

  step(dt: number): PhysicsFrameResult {
    const pocketedBallIds: number[] = []
    let firstHitBallId: number | null = null

    for (const ball of this.balls) {
      if (!ball.active || ball.pocketed) {
        continue
      }

      ball.position = ball.position.add(ball.velocity.multiply(dt))
      ball.velocity = ball.velocity.multiply(Math.pow(this.config.friction, dt * 120))
      this.handleRailCollision(ball)
      this.handlePocket(ball, pocketedBallIds)
      this.applyStopThreshold(ball)
    }

    for (let i = 0; i < this.balls.length; i += 1) {
      for (let j = i + 1; j < this.balls.length; j += 1) {
        const first = this.balls[i]
        const second = this.balls[j]
        if (!first.active || !second.active || first.pocketed || second.pocketed) {
          continue
        }

        const collisionResult = this.resolveBallCollision(first, second)
        if (collisionResult && firstHitBallId === null) {
          const { cueBallId, otherBallId } = collisionResult
          if (cueBallId !== null) {
            firstHitBallId = otherBallId
          }
        }
      }
    }

    const allStopped = this.balls.every((ball) => ball.pocketed || ball.velocity.length() < this.config.minVelocity)

    this.lastFrame = {
      firstHitBallId,
      pocketedBallIds,
      allStopped
    }

    this.options.logger.info('PhysicsWorld', 'step', {
      dt,
      firstHitBallId,
      pocketedBallIds,
      allStopped
    })

    return this.lastFrame
  }

  getLastFrame(): PhysicsFrameResult {
    return this.lastFrame
  }

  private handleRailCollision(ball: BallBody): void {
    const radius = ball.radius
    const minX = this.layout.feltRect.x + radius
    const minY = this.layout.feltRect.y + radius
    const maxX = this.layout.feltRect.x + this.layout.feltRect.width - radius
    const maxY = this.layout.feltRect.y + this.layout.feltRect.height - radius
    let collided = false

    if (ball.position.x < minX) {
      ball.position = new Vector2(minX, ball.position.y)
      ball.velocity = new Vector2(Math.abs(ball.velocity.x) * this.config.railRestitution, ball.velocity.y)
      collided = true
    } else if (ball.position.x > maxX) {
      ball.position = new Vector2(maxX, ball.position.y)
      ball.velocity = new Vector2(-Math.abs(ball.velocity.x) * this.config.railRestitution, ball.velocity.y)
      collided = true
    }

    if (ball.position.y < minY) {
      ball.position = new Vector2(ball.position.x, minY)
      ball.velocity = new Vector2(ball.velocity.x, Math.abs(ball.velocity.y) * this.config.railRestitution)
      collided = true
    } else if (ball.position.y > maxY) {
      ball.position = new Vector2(ball.position.x, maxY)
      ball.velocity = new Vector2(ball.velocity.x, -Math.abs(ball.velocity.y) * this.config.railRestitution)
      collided = true
    }

    if (collided) {
      this.options.logger.info('PhysicsWorld', 'collision-rail', { ballId: ball.id })
    }
  }

  private handlePocket(ball: BallBody, pocketedBallIds: number[]): void {
    for (const pocket of this.pockets) {
      if (ball.position.distanceTo(pocket.center) <= pocket.captureRadius) {
        ball.active = false
        ball.pocketed = true
        ball.velocity = Vector2.zero()
        if (!pocketedBallIds.includes(ball.id)) {
          pocketedBallIds.push(ball.id)
        }
        this.options.logger.info('PhysicsWorld', 'ball-pocketed', { ballId: ball.id })
        return
      }
    }
  }

  private applyStopThreshold(ball: BallBody): void {
    if (ball.velocity.length() < this.config.minVelocity) {
      ball.velocity = Vector2.zero()
    }
  }

  private resolveBallCollision(first: BallBody, second: BallBody): { cueBallId: number | null; otherBallId: number } | null {
    const delta = second.position.subtract(first.position)
    const distance = delta.length()
    const minDistance = first.radius + second.radius

    if (distance === 0 || distance > minDistance) {
      return null
    }

    const normal = delta.normalized()
    const relativeVelocity = second.velocity.subtract(first.velocity)
    const speedAlongNormal = relativeVelocity.dot(normal)

    if (speedAlongNormal > 0) {
      return null
    }

    const impulseMagnitude = -(1 + this.config.ballRestitution) * speedAlongNormal / ((1 / first.mass) + (1 / second.mass))
    const impulse = normal.multiply(impulseMagnitude)

    // Apply impulses in opposite directions along the collision normal.
    // NOTE: Flipping these signs injects energy and causes "越撞越快".
    first.velocity = first.velocity.subtract(impulse.multiply(1 / first.mass))
    second.velocity = second.velocity.add(impulse.multiply(1 / second.mass))

    const overlap = minDistance - distance
    const correction = normal.multiply(overlap / 2)
    first.position = first.position.subtract(correction)
    second.position = second.position.add(correction)

    this.options.logger.info('PhysicsWorld', 'collision-ball', {
      firstBallId: first.id,
      secondBallId: second.id
    })

    if (first.type === 'cue') {
      return { cueBallId: first.id, otherBallId: second.id }
    }

    if (second.type === 'cue') {
      return { cueBallId: second.id, otherBallId: first.id }
    }

    return { cueBallId: null, otherBallId: second.id }
  }
}
