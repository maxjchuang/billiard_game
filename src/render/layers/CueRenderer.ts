import { Vector2 } from '../../physics/math/Vector2'
import type { Logger } from '../../shared/logger/Logger'

export class CueRenderer {
  constructor(private readonly logger: Logger) {}

  render(ctx: CanvasRenderingContext2D, cueBallPosition: Vector2, aimAngle: number): void {
    const length = 120
    const direction = Vector2.fromAngle(aimAngle).multiply(-length)
    const end = cueBallPosition.add(direction)

    ctx.beginPath()
    ctx.moveTo(cueBallPosition.x, cueBallPosition.y)
    ctx.lineTo(end.x, end.y)
    ctx.strokeStyle = '#deb887'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.closePath()

    this.logger.info('CueRenderer', 'render', { aimAngle })
  }
}
