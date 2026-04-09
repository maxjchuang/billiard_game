import type { Logger } from '../../shared/logger/Logger'

export class DeviceService {
  constructor(private readonly logger: Logger) {}

  vibrateShort(): void {
    this.logger.info('DeviceService', 'vibrate-short')
  }
}
