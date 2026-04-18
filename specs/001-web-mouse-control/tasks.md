# Tasks: dev:web 鼠标操作支持

**Input**: Design documents from `/specs/001-web-mouse-control/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 本特性明确要求可验证与稳定性保障，包含测试任务（单元测试 + 关键交互回归测试）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- 本 feature 主要涉及：`src/web.ts`、`src/game/GameApp.ts`、`src/input/*`、`src/render/*` 与对应测试目录

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 为 Web 鼠标交互建立最小代码与测试骨架

- [x] T001 创建 Web 交互模块目录结构并导出入口文件 `src/web/input/index.ts` 与 `src/web/ui/index.ts`
- [x] T002 [P] 新增 Web 鼠标交互测试骨架 `tests/input/WebMouseSession.test.ts`
- [x] T003 [P] 新增 Web 控制入口测试骨架 `tests/input/WebControlsIntent.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事共享的输入语义、状态查询与映射能力

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 扩展输入意图类型与校验逻辑以支持 Web 控制行为 `src/input/InputManager.ts`
- [x] T005 在 `GameApp` 增加 Web 输入可用性快照接口（是否可出杆、是否可开始/重开/返回）`src/game/GameApp.ts`
- [x] T006 [P] 在 `GameApp` 增加“仅更新瞄准/力度但不出杆”的预览接口 `src/game/GameApp.ts`
- [x] T007 实现鼠标坐标到角度/力度的纯函数映射与力度夹断工具 `src/input/gesture/MouseShotMapper.ts`
- [x] T008 [P] 为映射工具与边界输入添加单元测试 `tests/input/MouseShotMapper.test.ts`
- [x] T009 在 Web 入口挂载基础生命周期（初始化、销毁、状态轮询）`src/web.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 鼠标完成一次出杆 (Priority: P1) 🎯 MVP

**Goal**: 用户在 `dev:web` 中可通过鼠标完成一次合法瞄准-蓄力-出杆，并推进回合

**Independent Test**: 不使用控制台命令，完成“按下拖拽释放 -> 单次出杆 -> 球停止后可再次出杆”

### Tests for User Story 1

- [x] T010 [P] [US1] 增加“单次交互只触发一次 shoot”失败测试 `tests/input/WebMouseSession.test.ts`
- [x] T011 [P] [US1] 增加“球运动中不允许再次出杆”失败测试 `tests/game/GameApp.web-input.test.ts`

### Implementation for User Story 1

- [x] T012 [P] [US1] 实现鼠标会话状态机（down/move/up）`src/web/input/WebMouseController.ts`
- [x] T013 [US1] 在释放时把有效会话映射为单次 `shoot` 意图 `src/web/input/WebMouseController.ts`
- [x] T014 [US1] 将 `WebMouseController` 接入 `dev:web` 启动链路 `src/web.ts`
- [x] T015 [US1] 在 `GameApp.consumeInput` 强化 shoot 状态门禁 `src/game/GameApp.ts`
- [x] T016 [US1] 完善会话重置与去重逻辑，避免重复 release 触发 `src/web/input/WebMouseController.ts`
- [x] T017 [US1] 补充关键链路日志（交互开始、触发击球、被门禁拒绝）`src/web/input/WebMouseController.ts` 与 `src/game/GameApp.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - 鼠标操作可预期且可取消 (Priority: P2)

**Goal**: 用户可在出杆前取消交互，并获得清晰反馈；边界输入不会导致异常

**Independent Test**: 可取消一次拖拽且不出杆；球桌外/快速连点/极端拖拽不导致非法流程推进

### Tests for User Story 2

- [x] T018 [P] [US2] 增加取消交互与球桌外输入失败测试 `tests/input/WebMouseSession.test.ts`
- [x] T019 [P] [US2] 增加快速连点去重与力度夹断失败测试 `tests/input/MouseShotMapper.test.ts`

### Implementation for User Story 2

- [x] T020 [US2] 实现取消动作（Esc/右键取消）与取消后会话失效 `src/web/input/WebMouseController.ts`
- [x] T021 [US2] 实现球桌边界校验与异常输入防护 `src/web/input/WebMouseController.ts`
- [x] T022 [US2] 实现瞄准/蓄力状态可视反馈层 `src/web/ui/WebHudOverlay.ts`
- [x] T023 [US2] 将实时瞄准/力度预览同步到游戏状态（不触发出杆）`src/game/GameApp.ts` 与 `src/web/input/WebMouseController.ts`
- [x] T024 [US2] 调整 HUD/副标题展示以反映交互状态 `src/render/Renderer.ts` 与 `src/game/GameApp.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - 菜单与重开流程支持鼠标 (Priority: P3)

**Goal**: 通过可点击入口完成开始对局、重开对局、返回菜单

**Independent Test**: 不依赖控制台命令，用户可点击完成开始/重开/返回菜单完整流程

### Tests for User Story 3

- [x] T025 [P] [US3] 增加控制入口在不同状态下可用性测试 `tests/core/WebControlAvailability.test.ts`
- [x] T026 [P] [US3] 增加 start/restart/back-menu 意图映射测试 `tests/input/WebControlsIntent.test.ts`

### Implementation for User Story 3

- [x] T027 [P] [US3] 实现 Web 控制面板组件（开始/重开/返回）`src/web/ui/WebControls.ts`
- [x] T028 [US3] 将按钮事件映射为 `InputManager` 意图 `src/web.ts` 与 `src/web/ui/WebControls.ts`
- [x] T029 [US3] 使用 `GameApp` 状态快照驱动按钮启用/禁用状态 `src/web.ts` 与 `src/web/ui/WebControls.ts`
- [x] T030 [US3] 校验菜单/对局/结算状态切换一致性并修正回归 `src/game/GameApp.ts`

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 文档、验证与收尾

- [x] T031 [P] 更新 Web 调试玩法说明（鼠标交互流程）`README.md`
- [x] T032 [P] 补充本 feature 的执行与验证记录 `specs/001-web-mouse-control/quickstart.md`
- [x] T033 执行质量门禁并记录结果 `npm run lint`、`npm test`、`npm run build`（记录到 `specs/001-web-mouse-control/quickstart.md`）
- [x] T034 [P] 删除未使用导出/变量并通过类型检查 `src/web.ts` 与 `src/game/GameApp.ts`
- [x] T035 [P] 校验无死代码告警且功能回归通过 `npm run lint` 与 `npm test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 and reuses US1 controller能力（建议在 US1 主干完成后执行）
- **Phase 5 (US3)**: Depends on Phase 2（可与 US2 并行）
- **Phase 6 (Polish)**: Depends on selected user stories completion

### User Story Dependencies

- **US1 (P1)**: MVP 主路径，优先落地
- **US2 (P2)**: 基于 US1 的交互会话能力扩展
- **US3 (P3)**: 与 US2 基本独立，仅共享基础状态快照

### Within Each User Story

- 先写失败测试，再写实现
- 输入映射/会话状态先于 UI 反馈
- 核心行为完成后再做日志与文档补充

### Parallel Opportunities

- Setup 阶段的测试骨架任务可并行（T002/T003）
- Foundational 中 T006 与 T008 可并行
- US1 中测试任务并行（T010/T011），实现中 T012 与部分接入任务可并行
- US2 与 US3 在 Phase 2 后可由不同开发者并行推进

---

## Parallel Example: User Story 1

```bash
# 并行执行 US1 测试任务
Task: "T010 [US1] 单次交互单次 shoot 测试"
Task: "T011 [US1] 运动中禁止出杆测试"

# 并行执行 US1 基础实现
Task: "T012 [US1] WebMouseController 会话状态机"
Task: "T014 [US1] Web 入口接线"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 + Phase 2
2. 完成 Phase 3 (US1)
3. 执行独立验证：无需控制台命令完成一次出杆流程
4. 满足即进入可演示状态

### Incremental Delivery

1. US1：核心鼠标出杆闭环
2. US2：取消与边界稳定性
3. US3：菜单与重开点击入口
4. 每阶段均可独立回归

### Parallel Team Strategy

1. 一人推进 Foundational
2. 一人推进 US2（待 US1 主干 ready）
3. 一人推进 US3（与 US2 并行）

---

## Notes

- 所有任务均遵循严格 checklist 格式
- `[P]` 仅用于可并行且文件冲突可控的任务
- 每个用户故事都定义了独立可验证标准
- 实施阶段建议小步提交，依赖已开启的 speckit 自动提交钩子
