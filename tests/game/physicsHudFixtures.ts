import type { PhysicsHudSnapshot, PhysicsParameterKey, PhysicsParameterView } from '../../src/config/PhysicsConfig'
import { GameApp } from '../../src/game/GameApp'
import { MemoryLogger } from '../../src/shared/logger/Logger'

export function createPhysicsHudApp(): { app: GameApp; logger: MemoryLogger } {
  const logger = new MemoryLogger()
  const app = new GameApp(logger)
  app.startMatch()
  return { app, logger }
}

export function getPhysicsHudState(app: GameApp): PhysicsHudSnapshot {
  return app.debugGetPhysicsHudState()
}

export function getPhysicsHudParameter(app: GameApp, key: PhysicsParameterKey): PhysicsParameterView {
  const parameter = getPhysicsHudState(app).parameters.find((item) => item.key === key)
  if (!parameter) {
    throw new Error(`Missing HUD parameter: ${key}`)
  }
  return parameter
}

export function stageAndApplyPhysicsParameter(app: GameApp, key: PhysicsParameterKey, valueText: string) {
  app.debugStagePhysicsParameter(key, valueText)
  return app.debugApplyPhysicsParameter(key)
}
