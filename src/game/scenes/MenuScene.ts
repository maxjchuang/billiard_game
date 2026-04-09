import type { Scene } from '../../core/scene/Scene'
import type { Logger } from '../../shared/logger/Logger'

export class MenuScene implements Scene {
  constructor(private readonly logger: Logger) {}

  enter(): void {
    this.logger.info('MenuScene', 'enter')
  }

  update(_: number): void {
    this.logger.info('MenuScene', 'update')
  }

  render(): void {
    this.logger.info('MenuScene', 'render')
  }

  exit(): void {
    this.logger.info('MenuScene', 'exit')
  }
}
