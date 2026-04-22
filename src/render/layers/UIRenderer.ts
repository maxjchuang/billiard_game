import { RenderConfig } from '../../config/RenderConfig'
import type { Logger } from '../../shared/logger/Logger'

export class UIRenderer {
  constructor(private readonly logger: Logger) {}

  render(ctx: CanvasRenderingContext2D, title: string, subtitle: string, detail: string): void {
    ctx.fillStyle = RenderConfig.hudColor
    ctx.font = '18px sans-serif'
    ctx.fillText(title, 20, 26)
    ctx.font = '13px sans-serif'
    ctx.fillText(subtitle, 20, 49)
    ctx.font = '12px sans-serif'
    ctx.fillText(detail, 20, 68)
    this.logger.info('UIRenderer', 'render', { title, subtitle, detail })
  }
}
