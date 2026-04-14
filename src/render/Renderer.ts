import type { BallBody } from '../physics/body/BallBody'
import { Vector2 } from '../physics/math/Vector2'
import { RenderConfig } from '../config/RenderConfig'
import type { Logger } from '../shared/logger/Logger'
import { BallRenderer } from './layers/BallRenderer'
import { CueRenderer } from './layers/CueRenderer'
import { TableRenderer } from './layers/TableRenderer'
import { UIRenderer } from './layers/UIRenderer'

export interface RenderSceneState {
  width: number
  height: number
  balls: BallBody[]
  cueBallPosition: Vector2
  aimAngle: number
  title: string
  subtitle: string
}

export class Renderer {
  private readonly tableRenderer: TableRenderer
  private readonly ballRenderer: BallRenderer
  private readonly cueRenderer: CueRenderer
  private readonly uiRenderer: UIRenderer

  constructor(private readonly ctx: CanvasRenderingContext2D, private readonly logger: Logger) {
    this.tableRenderer = new TableRenderer(logger)
    this.ballRenderer = new BallRenderer(logger)
    this.cueRenderer = new CueRenderer(logger)
    this.uiRenderer = new UIRenderer(logger)
  }

  render(sceneState: RenderSceneState): void {
    const hudHeight = RenderConfig.hudHeight
    const canvasWidth = sceneState.width
    const canvasHeight = sceneState.height + hudHeight

    // Clear whole canvas and draw HUD background (HUD 与球桌不重叠)
    this.ctx.fillStyle = RenderConfig.backgroundColor
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    this.ctx.fillStyle = RenderConfig.hudBackgroundColor
    this.ctx.fillRect(0, 0, canvasWidth, hudHeight)

    // Render HUD in the top bar
    this.uiRenderer.render(this.ctx, sceneState.title, sceneState.subtitle)

    // Render table + balls + cue below the HUD bar
    this.ctx.save()
    this.ctx.translate(0, hudHeight)
    this.tableRenderer.render(this.ctx, sceneState.width, sceneState.height)
    this.ballRenderer.render(this.ctx, sceneState.balls)
    this.cueRenderer.render(this.ctx, sceneState.cueBallPosition, sceneState.aimAngle)
    this.ctx.restore()

    this.logger.info('Renderer', 'render-frame', {
      title: sceneState.title,
      subtitle: sceneState.subtitle
    })
  }
}
