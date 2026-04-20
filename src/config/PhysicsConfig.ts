export const PhysicsConfig = {
  fixedDt: 1 / 120,
  // 摩擦衰减：Demo 阶段需要保证母球能稳定触发首碰与基础对局闭环
  // 0.985 会导致滑行距离极短，难以碰撞默认摆球
  friction: 0.999,
  // 停球阈值（px/s）：低于阈值视为停止，用于缩短“收尾慢速”阶段等待
  minVelocity: 0.1,
  railRestitution: 0.92,
  ballRestitution: 0.98,
  pocketCaptureRadius: 18,
  // 标定：在 640px 桌面尺度下，满力度应能在合理时间内触发首碰
  maxCueSpeed: 200
}

export type PhysicsConfigShape = typeof PhysicsConfig
