import type { Logger } from '../../shared/logger/Logger'
import type { Scene } from './Scene'

export class SceneManager {
  private currentScene: Scene | null = null

  constructor(private readonly logger: Logger) {}

  setScene(scene: Scene, sceneName: string): void {
    this.currentScene?.exit()
    this.currentScene = scene
    this.logger.info('SceneManager', 'set-scene', { sceneName })
    this.currentScene.enter()
  }

  update(dt: number): void {
    this.currentScene?.update(dt)
  }

  render(): void {
    this.currentScene?.render()
  }
}
