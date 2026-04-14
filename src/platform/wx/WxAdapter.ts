import type { Logger } from '../../shared/logger/Logger'

export interface WxLike {
  createCanvas?: () => unknown
  getSystemInfoSync?: () => { screenWidth: number; screenHeight: number }
}

export class WxAdapter {
  private runtime: 'wx' | 'browser' | 'unknown' = 'unknown'

  constructor(private readonly wxLike: WxLike | undefined, private readonly logger: Logger) {}

  getRuntime(): 'wx' | 'browser' | 'unknown' {
    return this.runtime
  }

  createCanvas(): HTMLCanvasElement | null {
    if (this.wxLike?.createCanvas) {
      this.runtime = 'wx'
      const canvas = this.wxLike.createCanvas() as HTMLCanvasElement
      this.logger.info('WxAdapter', 'create-canvas', { runtime: 'wx' })
      return canvas
    }

    if (typeof document !== 'undefined') {
      this.runtime = 'browser'
      const canvas = document.createElement('canvas')
      canvas.id = 'game-canvas'
      canvas.style.display = 'block'
      // 尺寸由 GameApp.boot() 统一设置，这里不强制拉伸到全屏
      document.body.appendChild(canvas)
      this.logger.info('WxAdapter', 'create-canvas', { runtime: 'browser' })
      return canvas
    }

    this.runtime = 'unknown'
    this.logger.warn('WxAdapter', 'create-canvas-unavailable')
    return null
  }

  getSystemInfo(): { screenWidth: number; screenHeight: number } {
    const systemInfo = this.wxLike?.getSystemInfoSync?.()
      ?? (typeof window !== 'undefined'
        ? { screenWidth: window.innerWidth, screenHeight: window.innerHeight }
        : { screenWidth: 640, screenHeight: 360 })
    this.logger.info('WxAdapter', 'get-system-info', systemInfo)
    return systemInfo
  }
}
