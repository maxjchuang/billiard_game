export const PhysicsConfig = {
  fixedDt: 1 / 120,
  // 摩擦衰减：Demo 阶段需要保证母球能稳定触发首碰与基础对局闭环
  // 0.985 会导致滑行距离极短，难以碰撞默认摆球
  friction: 0.999,
  minVelocity: 0.02,
  railRestitution: 0.92,
  ballRestitution: 0.98,
  pocketCaptureRadius: 18,
  maxCueSpeed: 38
}

export type PhysicsConfigShape = typeof PhysicsConfig
