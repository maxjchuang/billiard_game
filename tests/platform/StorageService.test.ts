import { describe, expect, it } from 'vitest'

import { StorageService } from '../../src/platform/wx/StorageService'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('StorageService', () => {
  it('stores and retrieves values with logs', () => {
    const logger = new MemoryLogger()
    const storage = new StorageService(logger)

    storage.setItem('demo', 'ready')
    const value = storage.getItem('demo')

    expect(value).toBe('ready')
    expect(logger.entries.some((entry) => entry.scope === 'StorageService' && entry.message === 'set-item')).toBe(true)
    expect(logger.entries.some((entry) => entry.scope === 'StorageService' && entry.message === 'get-item')).toBe(true)
  })
})
