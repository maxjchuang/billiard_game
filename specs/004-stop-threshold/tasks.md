# Tasks: Stop Threshold Tuning

**Input**: Design documents from `specs/004-stop-threshold/`  
**Prerequisites**: `specs/004-stop-threshold/plan.md`, `specs/004-stop-threshold/spec.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立停球阈值回归测试的基础能力

- [X] T001 [P] Add speed magnitude helper (`|v|` in px/s) for stop-threshold tests in `tests/physics/PhysicsWorld.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 先写回归测试锁定行为（TDD），再进入实现

- [X] T002 [US1] Add failing regression: once speed first drops below `0.1px/s`, the ball should be stopped within `0.2s` in `tests/physics/PhysicsWorld.test.ts`
- [X] T003 [US2] Add failing regression: ball speed above `0.1px/s` must not be forced to stop in `tests/physics/PhysicsWorld.test.ts`

---

## Phase 3: User Story 1 - 收尾阶段更快结束 (Priority: P1) 🎯 MVP

**Goal**: 低速收尾阶段更快判停，缩短回合等待

**Independent Test**: `npm test` 中的“低速 0.2s 内判停”回归用例通过

- [X] T004 [US1] Tune stop threshold to `0.1px/s` in `src/config/PhysicsConfig.ts`
- [X] T005 [US1] Ensure `applyStopThreshold` uses the configured threshold consistently in `src/physics/PhysicsWorld.ts`

---

## Phase 4: User Story 2 - 不引入可感知的物理/规则回归 (Priority: P2)

**Goal**: 不出现可感知提前停球；对局推进与现有判定保持一致

**Independent Test**: 全量单测通过；“高于阈值不提前停球”用例通过

- [X] T006 [US2] Run and adjust tests if needed to keep existing behaviors intact in `tests/physics/PhysicsWorld.test.ts`

---

## Phase 5: Quality Gates

**Goal**: 通过质量门禁

- [X] T007 Run quality gates: `npm run lint`, `npm test`, `npm run build`

---

## Dependencies & Execution Order

- Setup (T001) → Foundational tests (T002, T003) → Implement (T004, T005) → Verify (T006) → Gates (T007)

## Parallel Opportunities

- T001 can be done independently first
- T004 and T005 are sequential (same subsystem) but can proceed once tests exist
