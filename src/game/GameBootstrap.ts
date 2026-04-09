import { createDefaultLogger } from '../shared/logger/Logger'
import { GameApp } from './GameApp'

export class GameBootstrap {
  static autoBoot(): GameApp | null {
    const logger = createDefaultLogger()
    const app = new GameApp(logger)
    const booted = app.boot()
    return booted ? app : null
  }
}
