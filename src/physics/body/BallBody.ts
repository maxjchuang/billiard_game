import { Vector2 } from '../math/Vector2'

export type BallType = 'cue' | 'solid' | 'stripe' | 'black'

export interface BallBody {
  id: number
  type: BallType
  number: number
  radius: number
  mass: number
  position: Vector2
  velocity: Vector2
  active: boolean
  pocketed: boolean
}

export interface BallOverrides extends Partial<BallBody> {
  id: number
  type: BallType
  number: number
}

export const createBall = (overrides: BallOverrides): BallBody => ({
  id: overrides.id,
  type: overrides.type,
  number: overrides.number,
  radius: overrides.radius ?? 10,
  mass: overrides.mass ?? 1,
  position: overrides.position ?? Vector2.zero(),
  velocity: overrides.velocity ?? Vector2.zero(),
  active: overrides.active ?? true,
  pocketed: overrides.pocketed ?? false
})
