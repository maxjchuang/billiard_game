import { describe, expect, it } from 'vitest'

import { FixedStepLoop } from '../../src/core/loop/FixedStepLoop'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('FixedStepLoop', () => {
  it('runs fixed steps and emits loop logs', () => {
    const logger = new MemoryLogger()
    let stepCount = 0
    const loop = new FixedStepLoop(1 / 10, () => {
      stepCount += 1
    }, logger)

    loop.tick(0.35)

    expect(stepCount).toBe(3)
    expect(logger.entries.some((entry) => entry.scope === 'FixedStepLoop' && entry.message === 'tick')).toBe(true)
  })
})
