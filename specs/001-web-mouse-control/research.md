# Research: dev:web 鼠标操作支持

## Decision 1: 使用 Pointer/Mouse 事件桥接到 InputIntent

- Decision: 在 `web.ts`（或其旁路 Web 输入模块）监听鼠标事件，转换为 `InputManager` 可消费的意图（start-match / shoot / restart-match / back-menu）。
- Rationale: 当前核心链路已通过 `InputIntent` 驱动，复用该抽象可最小化对 `GameApp` 的侵入。
- Alternatives considered:
  - 直接在 DOM 事件中调用 `GameApp.debugShoot`：实现快，但绕过统一输入语义，不利于后续维护。
  - 在 `GameApp` 内直接处理 DOM 事件：耦合入口层与业务层，破坏分层。

## Decision 2: 一次交互仅允许一次出杆

- Decision: 鼠标按下开始交互会话，鼠标释放时若状态允许且会话有效则触发一次 shoot；释放后立即结束会话，重复 release 不生效。
- Rationale: 满足 FR-002，避免重复触发。
- Alternatives considered:
  - 每次 mousemove 实时触发 shoot：不符合台球交互语义。
  - 允许长按期间多次击球：违反规则流程。

## Decision 3: 支持取消与边界保护

- Decision: 在释放前提供取消路径（如 ESC 或右键取消，具体交互可在 tasks 阶段细化）；对球桌外输入、运动中输入、极端力度进行保护和夹断。
- Rationale: 满足 FR-003/FR-005/FR-007，显著降低误操作。
- Alternatives considered:
  - 不支持取消：误触成本高。
  - 仅靠 UI 提示不做逻辑保护：稳定性不足。

## Decision 4: 最小 UI 反馈策略

- Decision: 在现有 HUD/页面上增加轻量状态提示（如“瞄准中/蓄力中/可出杆”及操作提示），并提供可点击的开始/重开/返回菜单入口。
- Rationale: 满足 FR-004/FR-006，且不会引入大规模渲染改造。
- Alternatives considered:
  - 完整 UI 系统重构：超出本 feature 范围。
  - 仅控制台日志反馈：不能满足“可点击、可感知”要求。

## Decision 5: 测试策略

- Decision: 以单元测试覆盖输入映射与状态约束，辅以 `dev:web` 手动冒烟验证。
- Rationale: 当前仓库以 Vitest 为主，能快速覆盖关键行为。
- Alternatives considered:
  - 仅手动测试：回归风险高。
  - 引入新的 E2E 框架：成本超出本 feature。
