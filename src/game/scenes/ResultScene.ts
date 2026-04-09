import type { Scene } from '../../core/scene/Scene'
import type { Logger } from '../../shared/logger/Logger'

export class ResultScene implements Scene {
  constructor(private readonly logger: Logger) {}

  enter(): void {
    this.logger.info('ResultScene', 'enter')
  }

  update(_: number): void {
    this.logger.info('ResultScene', 'update')
  }

  render(): void {
    this.logger.info('ResultScene', 'render')
  }

  exit(): void {
    this.logger.info('ResultScene', 'exit')
  }
}
