import type { RuntimePhysicsConfig } from '../../config/PhysicsConfig'
import type { BallBody } from '../../physics/body/BallBody'
import { Vector2 } from '../../physics/math/Vector2'
import type { Logger } from '../../shared/logger/Logger'

export class ShotResolver {
  constructor(
    private readonly logger: Logger,
    private readonly config: RuntimePhysicsConfig
  ) {}

  shoot(cueBall: BallBody, aimAngle: number, powerPercent: number): Vector2 {
    const clampedPower = Math.max(0, Math.min(1, powerPercent))
    const velocity = Vector2.fromAngle(aimAngle)
      .normalized()
      .multiply(this.config.maxCueSpeed * clampedPower)

    cueBall.velocity = velocity
    cueBall.active = true

    this.logger.info('ShotResolver', 'shoot', {
      cueBallId: cueBall.id,
      aimAngle,
      powerPercent: clampedPower,
      velocityX: velocity.x,
      velocityY: velocity.y
    })

    return velocity
  }
}
