import type { Logger } from '../../shared/logger/Logger'

export class StateMachine<S extends string> {
  private state: S

  constructor(initialState: S, private readonly logger: Logger) {
    this.state = initialState
    this.logger.info('StateMachine', 'init', { state: initialState })
  }

  get current(): S {
    return this.state
  }

  transition(nextState: S, reason: string): void {
    const previousState = this.state
    this.state = nextState
    this.logger.info('StateMachine', 'transition', {
      previousState,
      nextState,
      reason
    })
  }
}
