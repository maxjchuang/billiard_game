# Data Model: Fix Shot Physics

本特性不新增持久化数据结构；只涉及现有运行时实体与参数。

## Entities

### BallBody

- 表示一颗球的物理状态：位置、速度、半径、质量、是否进袋。
- 来源：`src/physics/body/BallBody.ts`

### PhysicsConfig

- 表示物理参数：固定步长、速度衰减、停止阈值、恢复系数、出杆速度上限等。
- 来源：`src/config/PhysicsConfig.ts`

## Derived Concepts

- **Shot velocity**：由“瞄准角 + 力度百分比”映射为白球初速度（赋值）。
- **Collision impulse**：由相对速度与法向计算冲量并更新两球速度。
