import { describe, expect, it } from 'vitest'

import { clampPower, mapDragToShot } from '../../src/input/gesture/MouseShotMapper'

describe('MouseShotMapper', () => {
  it('maps drag vector into angle and clamped power', () => {
    const mapped = mapDragToShot({ x: 10, y: 20 }, { x: 120, y: 20 }, { maxPowerDistance: 100 })

    expect(mapped.angle).toBe(0)
    expect(mapped.power).toBe(1)
  })

  it('clamps invalid values into [0,1]', () => {
    expect(clampPower(-0.2)).toBe(0)
    expect(clampPower(2)).toBe(1)
    expect(clampPower(Number.NaN)).toBe(0)
  })
})
