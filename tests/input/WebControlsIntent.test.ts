import { describe, expect, it } from 'vitest'

import { toControlIntent } from '../../src/web/input/mapWebControlAction'

describe('toControlIntent', () => {
  it('maps actions to InputIntent types', () => {
    expect(toControlIntent('start-match')).toEqual({ type: 'start-match' })
    expect(toControlIntent('restart-match')).toEqual({ type: 'restart-match' })
    expect(toControlIntent('back-menu')).toEqual({ type: 'back-menu' })
  })
})
