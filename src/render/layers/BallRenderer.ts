import type { BallBody } from '../../physics/body/BallBody'
import type { Logger } from '../../shared/logger/Logger'

export class BallRenderer {
  constructor(private readonly logger: Logger) {}

  render(ctx: CanvasRenderingContext2D, balls: BallBody[]): void {
    for (const ball of balls) {
      if (ball.pocketed) {
        continue
      }

      ctx.beginPath()
      ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = this.colorForBall(ball.type)
      ctx.fill()
      ctx.closePath()
    }

    this.logger.info('BallRenderer', 'render', { ballCount: balls.filter((ball) => !ball.pocketed).length })
  }

  private colorForBall(type: BallBody['type']): string {
    switch (type) {
      case 'cue':
        return '#ffffff'
      case 'solid':
        return '#f4c20d'
      case 'stripe':
        return '#4285f4'
      case 'black':
        return '#111111'
    }
  }
}
