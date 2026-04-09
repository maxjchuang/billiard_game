export class Vector2 {
  constructor(public readonly x: number, public readonly y: number) {}

  static zero(): Vector2 {
    return new Vector2(0, 0)
  }

  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle))
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y)
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y)
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y
  }

  length(): number {
    return Math.hypot(this.x, this.y)
  }

  normalized(): Vector2 {
    const length = this.length()
    if (length === 0) {
      return Vector2.zero()
    }

    return this.multiply(1 / length)
  }

  distanceTo(other: Vector2): number {
    return this.subtract(other).length()
  }
}
