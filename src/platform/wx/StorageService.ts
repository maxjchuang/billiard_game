import type { Logger } from '../../shared/logger/Logger'

export class StorageService {
  private readonly store = new Map<string, string>()

  constructor(private readonly logger: Logger) {}

  setItem(key: string, value: string): void {
    this.store.set(key, value)
    this.logger.info('StorageService', 'set-item', { key })
  }

  getItem(key: string): string | null {
    const value = this.store.get(key) ?? null
    this.logger.info('StorageService', 'get-item', { key, hit: value !== null })
    return value
  }
}
