export const PhysicsConfig = {
  fixedDt: 1 / 120,
  friction: 0.985,
  minVelocity: 0.02,
  railRestitution: 0.92,
  ballRestitution: 0.98,
  pocketCaptureRadius: 18,
  maxCueSpeed: 38
}

export type PhysicsConfigShape = typeof PhysicsConfig
