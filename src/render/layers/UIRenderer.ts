import { RenderConfig } from '../../config/RenderConfig'
import type { Logger } from '../../shared/logger/Logger'

export class UIRenderer {
  constructor(private readonly logger: Logger) {}

  render(ctx: CanvasRenderingContext2D, title: string, subtitle: string): void {
    ctx.fillStyle = RenderConfig.hudColor
    ctx.font = '20px sans-serif'
    ctx.fillText(title, 24, 28)
    ctx.font = '14px sans-serif'
    ctx.fillText(subtitle, 24, 52)
    this.logger.info('UIRenderer', 'render', { title, subtitle })
  }
}
