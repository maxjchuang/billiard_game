import { RenderConfig } from '../../config/RenderConfig'
import type { Logger } from '../../shared/logger/Logger'
import type { TableLayout } from '../../shared/TableLayout'

export class TableRenderer {
  private lastLoggedLayoutKey: string | null = null

  constructor(private readonly logger: Logger) {}

  render(ctx: CanvasRenderingContext2D, width: number, height: number, layout: TableLayout): void {

    // Wood rails/border (background)
    ctx.fillStyle = RenderConfig.railColor
    ctx.fillRect(0, 0, width, height)

    // Felt (playfield)
    ctx.fillStyle = RenderConfig.tableColor
    ctx.fillRect(layout.feltRect.x, layout.feltRect.y, layout.feltRect.width, layout.feltRect.height)

    // Pockets
    for (const pocket of layout.pockets) {
      // Rim/shadow for contrast
      ctx.fillStyle = RenderConfig.pocketRimColor
      ctx.beginPath()
      ctx.arc(pocket.center.x, pocket.center.y, pocket.visualRadius + 2, 0, Math.PI * 2)
      ctx.fill()

      // Hole
      ctx.fillStyle = RenderConfig.pocketColor
      ctx.beginPath()
      ctx.arc(pocket.center.x, pocket.center.y, pocket.visualRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    const layoutKey = `${width}x${height}:${layout.railThickness}:${layout.pockets.map((pocket) => pocket.captureRadius).join(',')}`
    if (this.lastLoggedLayoutKey !== layoutKey) {
      this.lastLoggedLayoutKey = layoutKey
      this.logger.info('TableRenderer', 'render-layout', {
        width,
        height,
        railThickness: layout.railThickness,
        feltRect: layout.feltRect,
        pockets: layout.pockets.map((p) => ({ id: p.id, center: p.center, visualRadius: p.visualRadius }))
      })
    }
  }
}
