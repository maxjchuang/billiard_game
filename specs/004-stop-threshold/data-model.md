# Data Model: Stop Threshold Tuning

本特性不新增持久化数据结构；只涉及现有运行时实体与参数。

## Entities

### PhysicsConfig

- 停球阈值：`minVelocity`（单位：`px/s`，按速度大小判断）
- 来源：`src/config/PhysicsConfig.ts`

### BallBody

- 速度向量：`velocity`（用于计算速度大小并做停球判定）
- 来源：`src/physics/body/BallBody.ts`

## Derived Concepts

- **Speed magnitude**：`|v| = sqrt(vx^2 + vy^2)`
- **Stopped**：当 `|v| < 0.1px/s` 时视为停止（速度置零）

