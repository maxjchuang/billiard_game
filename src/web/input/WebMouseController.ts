import { mapDragToShot } from '../../input/gesture/MouseShotMapper'
import type { Logger } from '../../shared/logger/Logger'

export interface PointerLikeEvent {
  clientX: number
  clientY: number
  button?: number
  preventDefault?: () => void
}

export interface RectLike {
  left: number
  right: number
  top: number
  bottom: number
}

export interface WebMouseControllerHooks {
  canShoot: () => boolean
  previewShot: (angle: number, power: number) => void
  shoot: (angle: number, power: number) => void
  cancelPreview: () => void
  setStatus: (status: string) => void
}

interface Session {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  cancelled: boolean
}

function isInside(rect: RectLike, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

export class WebMouseController {
  private session: Session = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    cancelled: false
  }

  constructor(private readonly hooks: WebMouseControllerHooks, private readonly logger: Logger) {}

  get active(): boolean {
    return this.session.active
  }

  pointerDown(event: PointerLikeEvent, tableRect: RectLike): void {
    if (event.button !== undefined && event.button !== 0) {
      return
    }

    if (!this.hooks.canShoot()) {
      this.hooks.setStatus('当前不可出杆')
      this.logger.info('WebMouseController', 'pointer-down-blocked-state')
      return
    }

    const x = event.clientX
    const y = event.clientY

    if (!isInside(tableRect, x, y)) {
      this.logger.info('WebMouseController', 'pointer-down-outside-table', { x, y })
      return
    }

    this.session = {
      active: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      cancelled: false
    }

    this.hooks.setStatus('瞄准中')
    this.logger.info('WebMouseController', 'pointer-down', { x, y })
  }

  pointerMove(event: PointerLikeEvent, tableRect: RectLike): void {
    if (!this.session.active || this.session.cancelled) {
      return
    }

    const x = event.clientX
    const y = event.clientY
    this.session.currentX = x
    this.session.currentY = y

    const mapped = mapDragToShot(
      { x: this.session.startX, y: this.session.startY },
      { x, y }
    )

    this.hooks.previewShot(mapped.angle, mapped.power)

    if (!isInside(tableRect, x, y)) {
      this.hooks.setStatus('球桌外，释放将取消')
    } else {
      this.hooks.setStatus('蓄力中')
    }
  }

  pointerUp(event: PointerLikeEvent, tableRect: RectLike): void {
    if (!this.session.active) {
      return
    }

    const x = event.clientX
    const y = event.clientY

    if (this.session.cancelled) {
      this.reset('已取消')
      return
    }

    if (!this.hooks.canShoot()) {
      this.reset('当前不可出杆')
      return
    }

    if (!isInside(tableRect, x, y)) {
      this.hooks.cancelPreview()
      this.reset('球桌外释放，已取消')
      return
    }

    const mapped = mapDragToShot(
      { x: this.session.startX, y: this.session.startY },
      { x, y }
    )

    this.hooks.shoot(mapped.angle, mapped.power)
    this.logger.info('WebMouseController', 'shoot', { angle: mapped.angle, power: mapped.power })
    this.reset('已出杆')
  }

  cancel(reason = '已取消'): void {
    if (!this.session.active) {
      return
    }

    this.session.cancelled = true
    this.hooks.cancelPreview()
    this.reset(reason)
    this.logger.info('WebMouseController', 'cancel', { reason })
  }

  private reset(status: string): void {
    this.session = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      cancelled: false
    }
    this.hooks.setStatus(status)
  }
}
