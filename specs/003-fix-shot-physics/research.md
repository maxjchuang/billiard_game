# Research: Fix Shot Physics

**Branch**: `003-fix-shot-physics`  
**Created**: 2026-04-20  
**Spec**: `specs/003-fix-shot-physics/spec.md`

## Decisions

### 决策 1：把“碰撞增能”作为一等回归风险处理

- **Decision**: 先用自动化回归用例锁定“碰撞后总运动强度不应显著增加”，再修改碰撞解析。
- **Rationale**: 球堆场景是高频连锁碰撞，任何微小的增能都会被放大。
- **Alternatives considered**:
  - 仅靠调低恢复系数/加大阻尼：可能掩盖问题但不稳定、难以验证。

### 决策 2：出杆速度采用“标定修正”而非改变模型

- **Decision**: 保持现有“瞬时赋速”模型不变，仅调整最大速度标定与回归验证。
- **Rationale**: 修改为受力/冲量积分会扩大范围并引入额外数值稳定性风险。

## Test Strategy

- 添加两球碰撞最小用例，验证碰撞不引入异常增能（允许少量数值误差）。
- 添加开球/首杆回归用例，验证满力度在合理时间窗口内触发首碰。
