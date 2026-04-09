import type { Logger } from '../../shared/logger/Logger'

export class AudioService {
  constructor(private readonly logger: Logger) {}

  play(soundName: string): void {
    this.logger.info('AudioService', 'play', { soundName })
  }
}
