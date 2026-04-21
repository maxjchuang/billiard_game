import { describe, expect, it } from 'vitest'

import { toControlIntent } from '../../src/web/input/mapWebControlAction'

describe('toControlIntent', () => {
  it('maps actions to InputIntent types', () => {
    expect(toControlIntent('start-match')).toEqual({ type: 'start-match' })
    expect(toControlIntent('restart-match')).toEqual({ type: 'restart-match' })
    expect(toControlIntent('back-menu')).toEqual({ type: 'back-menu' })
    expect(toControlIntent('break-option-behind-line-ball-in-hand')).toEqual({
      type: 'choose-break-foul-option',
      option: 'behind-line-ball-in-hand'
    })
    expect(toControlIntent('break-option-re-rack')).toEqual({
      type: 'choose-break-foul-option',
      option: 're-rack'
    })
    expect(toControlIntent('break-option-accept-table')).toEqual({
      type: 'choose-break-foul-option',
      option: 'accept-table'
    })
    expect(toControlIntent('group-solid')).toEqual({ type: 'choose-group', group: 'solid' })
    expect(toControlIntent('group-stripe')).toEqual({ type: 'choose-group', group: 'stripe' })
  })
})
