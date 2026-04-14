import { RenderConfig } from '../../config/RenderConfig'
import type { Logger } from '../../shared/logger/Logger'

export class TableRenderer {
  constructor(private readonly logger: Logger) {}

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = RenderConfig.tableColor
    ctx.fillRect(20, 20, width - 40, height - 40)
    this.logger.info('TableRenderer', 'render', { width, height })
  }
}
