import { describe, expect, it } from 'vitest'

import { MemoryLogger } from '../../src/shared/logger/Logger'
import { StateMachine } from '../../src/core/fsm/StateMachine'

describe('StateMachine', () => {
  it('transitions to the next state and records logs', () => {
    const logger = new MemoryLogger()
    const machine = new StateMachine<'menu' | 'aiming'>('menu', logger)

    machine.transition('aiming', 'start-match')

    expect(machine.current).toBe('aiming')
    expect(logger.entries.some((entry) => entry.scope === 'StateMachine' && entry.message === 'transition')).toBe(true)
  })
})
