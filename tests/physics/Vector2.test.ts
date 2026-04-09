import { describe, expect, it } from 'vitest'

import { Vector2 } from '../../src/physics/math/Vector2'

describe('Vector2', () => {
  it('normalizes a vector and preserves direction', () => {
    const vector = new Vector2(3, 4)
    const normalized = vector.normalized()

    expect(normalized.length()).toBeCloseTo(1)
    expect(normalized.x).toBeCloseTo(0.6)
    expect(normalized.y).toBeCloseTo(0.8)
  })
})
