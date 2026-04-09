import type { Logger } from '../shared/logger/Logger'

export type InputIntent =
  | { type: 'start-match' }
  | { type: 'shoot'; angle: number; power: number }
  | { type: 'restart-match' }
  | { type: 'back-menu' }

export class InputManager {
  private intents: InputIntent[] = []

  constructor(private readonly logger: Logger) {}

  pushIntent(intent: InputIntent): void {
    this.intents.push(intent)
    this.logger.info('InputManager', 'push-intent', { intentType: intent.type })
  }

  drainIntents(): InputIntent[] {
    const drained = [...this.intents]
    this.intents = []
    return drained
  }
}
