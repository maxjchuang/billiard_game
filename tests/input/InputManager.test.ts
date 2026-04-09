import { describe, expect, it } from 'vitest'

import { InputManager } from '../../src/input/InputManager'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('InputManager', () => {
  it('queues and drains intents with logs', () => {
    const logger = new MemoryLogger()
    const inputManager = new InputManager(logger)

    inputManager.pushIntent({ type: 'start-match' })
    inputManager.pushIntent({ type: 'shoot', angle: 0.4, power: 0.8 })

    const intents = inputManager.drainIntents()

    expect(intents).toHaveLength(2)
    expect(logger.entries.filter((entry) => entry.scope === 'InputManager' && entry.message === 'push-intent')).toHaveLength(2)
  })
})
