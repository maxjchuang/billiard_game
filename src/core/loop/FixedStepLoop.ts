import type { Logger } from '../../shared/logger/Logger'

export class FixedStepLoop {
  private accumulator = 0

  constructor(
    private readonly fixedDt: number,
    private readonly onStep: (dt: number) => void,
    private readonly logger: Logger
  ) {}

  tick(deltaTime: number): void {
    this.accumulator += deltaTime
    while (this.accumulator >= this.fixedDt) {
      this.onStep(this.fixedDt)
      this.accumulator -= this.fixedDt
    }

    this.logger.info('FixedStepLoop', 'tick', {
      deltaTime,
      fixedDt: this.fixedDt,
      accumulator: this.accumulator
    })
  }
}
