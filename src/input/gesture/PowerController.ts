import type { Logger } from '../../shared/logger/Logger'

export class PowerController {
  public powerPercent = 0

  constructor(private readonly logger: Logger) {}

  update(distance: number, maxDistance: number): number {
    this.powerPercent = Math.max(0, Math.min(1, maxDistance === 0 ? 0 : distance / maxDistance))
    this.logger.info('PowerController', 'update', { powerPercent: this.powerPercent })
    return this.powerPercent
  }
}
