import { describe, expect, it } from 'vitest'

import { AimController } from '../../src/input/gesture/AimController'
import { PowerController } from '../../src/input/gesture/PowerController'
import { Vector2 } from '../../src/physics/math/Vector2'
import { MemoryLogger } from '../../src/shared/logger/Logger'

describe('AimController and PowerController', () => {
  it('calculates aim angle and power percentage', () => {
    const logger = new MemoryLogger()
    const aimController = new AimController(logger)
    const powerController = new PowerController(logger)

    const angle = aimController.update(new Vector2(0, 0), new Vector2(0, 10))
    const power = powerController.update(45, 100)

    expect(angle).toBeCloseTo(Math.PI / 2)
    expect(power).toBeCloseTo(0.45)
    expect(logger.entries.some((entry) => entry.scope === 'AimController' && entry.message === 'update')).toBe(true)
    expect(logger.entries.some((entry) => entry.scope === 'PowerController' && entry.message === 'update')).toBe(true)
  })
})
