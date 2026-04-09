import type { Logger } from '../../shared/logger/Logger'

export interface WxLike {
  createCanvas?: () => unknown
  getSystemInfoSync?: () => { screenWidth: number; screenHeight: number }
}

export class WxAdapter {
  constructor(private readonly wxLike: WxLike | undefined, private readonly logger: Logger) {}

  createCanvas(): HTMLCanvasElement | null {
    if (!this.wxLike?.createCanvas) {
      this.logger.warn('WxAdapter', 'create-canvas-unavailable')
      return null
    }

    const canvas = this.wxLike.createCanvas() as HTMLCanvasElement
    this.logger.info('WxAdapter', 'create-canvas')
    return canvas
  }

  getSystemInfo(): { screenWidth: number; screenHeight: number } {
    const systemInfo = this.wxLike?.getSystemInfoSync?.() ?? { screenWidth: 640, screenHeight: 360 }
    this.logger.info('WxAdapter', 'get-system-info', systemInfo)
    return systemInfo
  }
}
