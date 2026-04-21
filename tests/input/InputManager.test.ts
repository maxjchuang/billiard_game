import { describe, expect, it } from 'vitest'

import { InputManager } from '../../src/input/InputManager'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('InputManager', () => {
  it('queues and drains intents with logs', () => {
    const logger = new MemoryLogger()
    const inputManager = new InputManager(logger)

    inputManager.pushIntent({ type: 'start-match' })
    inputManager.pushIntent({ type: 'shoot', angle: 0.4, power: 0.8 })
    inputManager.pushIntent({ type: 'choose-break-foul-option', option: 'accept-table' })
    inputManager.pushIntent({ type: 'choose-group', group: 'solid' })

    const intents = inputManager.drainIntents()

    expect(intents).toHaveLength(4)
    expect(logger.entries.filter((entry) => entry.scope === 'InputManager' && entry.message === 'push-intent')).toHaveLength(4)
  })
})
