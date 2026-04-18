export interface Point2D {
  x: number
  y: number
}

export interface MappedShot {
  angle: number
  power: number
}

export interface MapShotOptions {
  maxPowerDistance?: number
}

const DEFAULT_MAX_POWER_DISTANCE = 220

export function clampPower(power: number): number {
  if (Number.isNaN(power)) {
    return 0
  }
  return Math.max(0, Math.min(1, power))
}

export function mapDragToShot(start: Point2D, current: Point2D, options?: MapShotOptions): MappedShot {
  const maxDistance = options?.maxPowerDistance ?? DEFAULT_MAX_POWER_DISTANCE
  const dx = current.x - start.x
  const dy = current.y - start.y
  const distance = Math.hypot(dx, dy)

  return {
    angle: Math.atan2(dy, dx),
    power: clampPower(maxDistance <= 0 ? 0 : distance / maxDistance)
  }
}
