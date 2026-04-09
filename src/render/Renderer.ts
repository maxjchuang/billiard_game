import type { BallBody } from '../physics/body/BallBody'
import { Vector2 } from '../physics/math/Vector2'
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
    this.tableRenderer.render(this.ctx, sceneState.width, sceneState.height)
    this.ballRenderer.render(this.ctx, sceneState.balls)
    this.cueRenderer.render(this.ctx, sceneState.cueBallPosition, sceneState.aimAngle)
    this.uiRenderer.render(this.ctx, sceneState.title, sceneState.subtitle)
    this.logger.info('Renderer', 'render-frame', {
      title: sceneState.title,
      subtitle: sceneState.subtitle
    })
  }
}
