import type { InputIntent } from '../../input/InputManager'

export type WebControlAction = 'start-match' | 'restart-match' | 'back-menu'

export function toControlIntent(action: WebControlAction): InputIntent {
  return { type: action }
}
