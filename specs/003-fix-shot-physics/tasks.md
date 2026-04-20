# Tasks: Fix Shot Physics

**Input**: Design documents from `specs/003-fix-shot-physics/`  
**Prerequisites**: `specs/003-fix-shot-physics/plan.md`, `specs/003-fix-shot-physics/spec.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立可复用的测试辅助与基线确认

- [X] T001 [P] Add kinetic energy helper for physics regression tests in `tests/physics/PhysicsWorld.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 先写回归测试锁定问题（TDD），再进入实现

- [X] T002 [US2] Add failing regression: two-ball collision must not increase total kinetic energy in `tests/physics/PhysicsWorld.test.ts`
- [X] T003 [US1] Add failing regression: full-power shot should hit rack ball within 1.5s (<=180 steps @120Hz) in `tests/gameplay/ShotResolver.test.ts`

---

## Phase 3: User Story 1 - 开球速度与距离符合直觉 (Priority: P1) 🎯 MVP

**Goal**: 满力度开球不再显著“过慢”，能在合理时间内发生首碰

**Independent Test**: `npm test` 中的开球回归用例通过

- [X] T004 [US1] Recalibrate shot speed ceiling to match table scale in `src/config/PhysicsConfig.ts`
- [X] T005 [US1] Keep shot power clamping stable (0..1) when mapping to velocity in `src/gameplay/flow/ShotResolver.ts`

---

## Phase 4: User Story 2 - 撞击球堆后不出现异常爆能 (Priority: P1)

**Goal**: 修复球-球碰撞疑似增能，连锁碰撞不再“越撞越快”

**Independent Test**: 两球碰撞回归用例通过，且现有首碰检测测试不回归

- [X] T006 [US2] Fix collision impulse application direction (no energy injection) in `src/physics/PhysicsWorld.ts`

---

## Phase 5: User Story 3 - 修复不引入规则与判定回归 (Priority: P2)

**Goal**: 首碰检测/停球判定/进袋判定保持既有行为

**Independent Test**: 全量单测 + lint/build 通过

- [X] T007 [US3] Run and adjust tests if needed to keep first-hit and stop-threshold behavior intact in `tests/physics/PhysicsWorld.test.ts`
- [X] T008 [US3] Run quality gates: `npm run lint`, `npm test`, `npm run build`

---

## Dependencies & Execution Order

- Setup (T001) → Foundational tests (T002, T003) → Implement US1/US2 (T004–T006) → Gates (T007, T008)

## Parallel Opportunities

- T001 可并行准备
- T004 与 T006 可并行（修改文件不同），但必须在对应测试已落地后执行
