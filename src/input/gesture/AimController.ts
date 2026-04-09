import { Vector2 } from '../../physics/math/Vector2'
import type { Logger } from '../../shared/logger/Logger'

export class AimController {
  public aimAngle = 0

  constructor(private readonly logger: Logger) {}

  update(from: Vector2, to: Vector2): number {
    const delta = to.subtract(from)
    this.aimAngle = Math.atan2(delta.y, delta.x)
    this.logger.info('AimController', 'update', { aimAngle: this.aimAngle })
    return this.aimAngle
  }
}
