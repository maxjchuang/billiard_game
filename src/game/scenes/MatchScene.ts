import type { Scene } from '../../core/scene/Scene'
import type { Logger } from '../../shared/logger/Logger'

export class MatchScene implements Scene {
  constructor(private readonly logger: Logger) {}

  enter(): void {
    this.logger.info('MatchScene', 'enter')
  }

  update(_: number): void {
    this.logger.info('MatchScene', 'update')
  }

  render(): void {
    this.logger.info('MatchScene', 'render')
  }

  exit(): void {
    this.logger.info('MatchScene', 'exit')
  }
}
