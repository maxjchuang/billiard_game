import type { InputIntent } from '../../input/InputManager'

export type WebControlAction =
  | 'start-match'
  | 'restart-match'
  | 'back-menu'
  | 'break-option-behind-line-ball-in-hand'
  | 'break-option-re-rack'
  | 'break-option-accept-table'
  | 'group-solid'
  | 'group-stripe'

export function toControlIntent(action: WebControlAction): InputIntent {
  if (action === 'break-option-behind-line-ball-in-hand') {
    return { type: 'choose-break-foul-option', option: 'behind-line-ball-in-hand' }
  }

  if (action === 'break-option-re-rack') {
    return { type: 'choose-break-foul-option', option: 're-rack' }
  }

  if (action === 'break-option-accept-table') {
    return { type: 'choose-break-foul-option', option: 'accept-table' }
  }

  if (action === 'group-solid') {
    return { type: 'choose-group', group: 'solid' }
  }

  if (action === 'group-stripe') {
    return { type: 'choose-group', group: 'stripe' }
  }

  return { type: action }
}
