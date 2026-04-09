import { describe, expect, it } from 'vitest'

import { SceneManager } from '../../src/core/scene/SceneManager'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('SceneManager', () => {
  it('switches scenes and logs scene transitions', () => {
    const logger = new MemoryLogger()
    const manager = new SceneManager(logger)
    const counters = { enter: 0, update: 0, render: 0, exit: 0 }
    const scene = {
      enter: () => {
        counters.enter += 1
      },
      update: () => {
        counters.update += 1
      },
      render: () => {
        counters.render += 1
      },
      exit: () => {
        counters.exit += 1
      }
    }

    manager.setScene(scene, 'test')
    manager.update(1 / 60)
    manager.render()

    expect(counters.enter).toBe(1)
    expect(counters.update).toBe(1)
    expect(counters.render).toBe(1)
    expect(logger.entries.some((entry) => entry.scope === 'SceneManager' && entry.message === 'set-scene')).toBe(true)
  })
})
