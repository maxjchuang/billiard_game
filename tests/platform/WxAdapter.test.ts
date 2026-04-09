import { describe, expect, it } from 'vitest'

import { WxAdapter } from '../../src/platform/wx/WxAdapter'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('WxAdapter', () => {
  it('falls back to default system info and logs unavailable canvas creation', () => {
    const logger = new MemoryLogger()
    const adapter = new WxAdapter(undefined, logger)

    const canvas = adapter.createCanvas()
    const systemInfo = adapter.getSystemInfo()

    expect(canvas).toBeNull()
    expect(systemInfo.screenWidth).toBe(640)
    expect(logger.entries.some((entry) => entry.scope === 'WxAdapter' && entry.message === 'create-canvas-unavailable')).toBe(true)
  })
})
