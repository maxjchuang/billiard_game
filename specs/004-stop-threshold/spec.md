# Feature Specification: Stop Threshold Tuning

**Feature Branch**: `004-stop-threshold`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "台球运动时，最后停下来的耗时太长。当球速低到一定程度，例如小于 0.1px/s 时，可以判定停止运动"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 收尾阶段更快结束 (Priority: P1)

作为玩家，我希望当球速已经低到肉眼几乎不可察觉时，对局能更快判定“球已停”，避免长时间等待。

**Why this priority**: 收尾等待会直接打断节奏，是最明显的可玩性问题。

**Independent Test**: 在一个低速滑行的回放/模拟场景中，验证当球速低于阈值时能快速被判定为停止。

**Acceptance Scenarios**:

1. **Given** 一颗球正在缓慢移动且其速度低于 `0.1px/s`，**When** 进入物理步进，**Then** 系统应在短时间内将该球视为停止（不再持续滑行）。
2. **Given** 多颗球均已进入低速收尾阶段，**When** 所有球速度都低于阈值，**Then** 系统应尽快判定“全部停止”，进入下一阶段。

---

### User Story 2 - 不引入可感知的物理/规则回归 (Priority: P2)

作为开发/测试，我希望提高停止阈值不会导致明显的“提前停球”违和感，也不会影响既有判定（例如首碰、进袋、回合推进）。

**Why this priority**: 停球判定属于基础能力，任何回归都会扩大影响面。

**Independent Test**: 运行现有自动化用例 + 新增回归用例即可验证。

**Acceptance Scenarios**:

1. **Given** 球速明显高于阈值，**When** 物理步进执行，**Then** 球应继续运动而不是被提前判停。
2. **Given** 现有关于首碰/进袋/回合推进的测试，**When** 运行全量测试，**Then** 所有测试应保持通过。

---

### Edge Cases

- 球速在阈值附近上下波动（例如短暂回弹/数值抖动）时，不应出现“反复停/动”导致状态抖动。
- 多球同时低速时，“全部停止”判定应稳定一致。
- 已进袋/失活的球不参与停球判定。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 在球的速度小于 `0.1px/s` 时，将该球判定为停止运动。
- **FR-002**: 系统 MUST 在所有球都满足停止条件时，判定“全部停止”并推进对局。
- **FR-003**: 系统 MUST 提供自动化回归测试覆盖“低速快速停球”与“高于阈值不提前停球”。
- **FR-004**: 系统 MUST 保持既有规则与关键判定行为不回归（例如首碰、进袋、回合推进）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 当球速低于 `0.1px/s` 后，系统在 `0.2s` 内将其视为停止（可通过自动化测试验证）。
- **SC-002**: 当所有球速度均低于阈值时，系统在 `0.2s` 内判定“全部停止”（可通过自动化测试验证）。
- **SC-003**: 全量测试与质量门禁通过：`npm run lint`、`npm test`、`npm run build`。

## Assumptions

- 速度单位以当前游戏坐标体系的 `px/s` 表示。
- 阈值 `0.1px/s` 以“速度大小”判断，而非分量。
- 本次调整仅针对“停止判定”，不改变出杆、碰撞、进袋等其他物理规则。

