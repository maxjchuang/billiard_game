---

description: "Tasks for physics parameter real-time HUD configuration"
---

# Tasks: 物理参数实时 HUD 配置

**Input**: Design documents from `specs/008-physics-hud-config/`  
**Prerequisites**: `specs/008-physics-hud-config/plan.md`, `specs/008-physics-hud-config/spec.md`, `specs/008-physics-hud-config/research.md`, `specs/008-physics-hud-config/data-model.md`, `specs/008-physics-hud-config/contracts/physics-hud-runtime-config.md`

**Analyze (Required)**: After generating `tasks.md`, run `/speckit.analyze` and provide the report in 中文 before `/speckit.implement`.

**Tests**: This feature follows the constitution’s test-first requirement, so regression tests are included and should fail before implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the shared runtime-config metadata and reusable verification helpers for the HUD feature.

- [ ] T001 [P] Add runtime physics defaults/types export helpers in `src/config/PhysicsConfig.ts`
- [ ] T002 [P] Add HUD-facing parameter descriptor types and descriptor source in `src/config/PhysicsConfig.ts` and `src/config/RenderConfig.ts`
- [ ] T003 [P] Create reusable physics HUD test fixtures/assertions in `tests/game/physicsHudFixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lock the shared runtime update seam before any user story implementation begins.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T004 [P] Add failing runtime-config propagation regressions in `tests/game/GameApp.web-input.test.ts` and `tests/physics/PhysicsWorld.test.ts`
- [ ] T005 [P] Add failing layout-refresh regressions for geometry-sensitive parameters in `tests/core/TableLayout.test.ts` and `tests/physics/PhysicsWorld.test.ts`
- [ ] T006 Create runtime physics config orchestration and apply/reset APIs in `src/game/GameApp.ts` and `src/config/PhysicsConfig.ts`
- [ ] T007 Implement geometry refresh hooks for `layout-refresh` parameters in `src/physics/PhysicsWorld.ts` and `src/shared/TableLayout.ts`
- [ ] T008 Add shared logging for parameter apply/reject/reset flows in `src/game/GameApp.ts` and `src/physics/PhysicsWorld.ts`

**Checkpoint**: Runtime config ownership, refresh semantics, and baseline regressions are ready.

---

## Phase 3: User Story 1 - 实时调节物理参数 (Priority: P1) 🎯 MVP

**Goal**: Let the player open a HUD, view supported parameters, and change them in-session with the updated values taking effect at the correct time.

**Independent Test**: Start `npm run dev:web`, open the HUD, change a supported parameter, and confirm the current or next shot behavior reflects the new value without reloading.

### Tests for User Story 1 ⚠️

> **NOTE: Complete T004 first and keep it failing until the implementation tasks below are done.**

- [ ] T009 [P] [US1] Add failing HUD rendering and interaction regressions in `tests/game/GameApp.web-input.test.ts`
- [ ] T010 [P] [US1] Add failing parameter-apply mode regressions in `tests/physics/PhysicsWorld.test.ts` and `tests/gameplay/ShotResolver.test.ts`

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement interactive parameter panel rendering and control wiring in `src/web/ui/WebHudOverlay.ts`
- [ ] T012 [US1] Wire HUD callbacks into runtime config APIs in `src/web.ts` and `src/game/GameApp.ts`
- [ ] T013 [US1] Apply `immediate` and `next-shot` parameter updates in `src/physics/PhysicsWorld.ts` and `src/gameplay/flow/ShotResolver.ts`
- [ ] T014 [US1] Expose HUD-visible runtime summaries and modified indicators in `src/game/GameApp.ts`, `src/render/Renderer.ts`, and `src/render/layers/UIRenderer.ts`

**Checkpoint**: User Story 1 is independently usable for in-session parameter tuning.

---

## Phase 4: User Story 2 - 调参过程安全可控 (Priority: P2)

**Goal**: Prevent invalid edits, preserve already-applied values, and present clear failure feedback while the simulation stays stable.

**Independent Test**: Try out-of-range, empty, and malformed values in the HUD and confirm the invalid edit is rejected, the user sees feedback, and previously applied settings remain active.

### Tests for User Story 2 ⚠️

> **NOTE: Keep validation regressions failing until the implementation tasks below are complete.**

- [ ] T015 [P] [US2] Add failing invalid-input and partial-failure regressions in `tests/game/GameApp.web-input.test.ts` and `tests/physics/PhysicsWorld.test.ts`
- [ ] T016 [P] [US2] Add failing HUD validation-state regressions in `tests/core/WebControlAvailability.test.ts`

### Implementation for User Story 2

- [ ] T017 [P] [US2] Implement parameter parsing, range validation, and descriptor-driven error messages in `src/game/GameApp.ts` and `src/config/PhysicsConfig.ts`
- [ ] T018 [US2] Render invalid-state feedback and non-blocking apply failures in `src/web/ui/WebHudOverlay.ts`
- [ ] T019 [US2] Ensure failed parameter updates do not roll back other active values in `src/game/GameApp.ts` and `src/physics/PhysicsWorld.ts`
- [ ] T020 [US2] Add observability logs for validation rejection and partial-success update flows in `src/game/GameApp.ts` and `src/web/ui/WebHudOverlay.ts`

**Checkpoint**: User Story 2 independently guarantees safe, validated tuning behavior.

---

## Phase 5: User Story 3 - 快速恢复与对比默认配置 (Priority: P3)

**Goal**: Let the player quickly compare against defaults, reset all supported parameters, and keep layout-sensitive parameters visually and physically synchronized after reset.

**Independent Test**: Modify several parameters, confirm they are marked as changed, trigger reset-to-defaults, and verify both the HUD state and the table behavior return to defaults immediately.

### Tests for User Story 3 ⚠️

> **NOTE: Keep reset/default-state regressions failing until the implementation tasks below are complete.**

- [ ] T021 [P] [US3] Add failing reset-to-default and dirty-state regressions in `tests/game/GameApp.web-input.test.ts`
- [ ] T022 [P] [US3] Add failing layout-sync-after-reset regressions in `tests/core/TableLayout.test.ts` and `tests/physics/PhysicsWorld.test.ts`

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement reset-all-to-defaults behavior in `src/game/GameApp.ts` and `src/config/PhysicsConfig.ts`
- [ ] T024 [US3] Render default-vs-modified state and reset controls in `src/web/ui/WebHudOverlay.ts`
- [ ] T025 [US3] Reapply layout-refresh synchronization during reset in `src/physics/PhysicsWorld.ts`, `src/shared/TableLayout.ts`, and `src/render/layers/TableRenderer.ts`
- [ ] T026 [US3] Surface reset/apply status messaging in `src/game/GameApp.ts` and `src/render/layers/UIRenderer.ts`

**Checkpoint**: User Story 3 independently supports fast comparison and safe return to defaults.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize docs, full regression coverage, and quality gates across all stories.

- [ ] T027 [P] Update HUD tuning documentation and usage notes in `README.md` and `specs/008-physics-hud-config/quickstart.md`
- [ ] T028 [P] Add final cross-story regression coverage for supported parameter descriptors and HUD summary output in `tests/game/GameApp.web-input.test.ts` and `tests/gameplay/ShotResolver.test.ts`
- [ ] T029 Run quality gates via `package.json` scripts (`npm run lint`, `npm test`, `npm run build`) and fix any issues in impacted files under `src/`, `tests/`, and `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately.
- Foundational (Phase 2) depends on Setup and blocks all user story work.
- User Story phases depend on Phase 2 completion.
- Polish (Phase 6) depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 and delivers the MVP interactive HUD tuning flow.
- **US2 (P2)**: Starts after Phase 2 and builds on US1 runtime update hooks plus descriptor metadata.
- **US3 (P3)**: Starts after Phase 2, but is safest after US1 and US2 because reset/default-state behavior reuses the same validation and apply pipeline.

### Task Flow

- T001–T003 → T004–T008 → T009–T014 → T015–T020 → T021–T026 → T027–T029

---

## Parallel Opportunities

- T001, T002, and T003 can run in parallel because they target separate setup seams.
- T004 and T005 can run in parallel once setup artifacts exist.
- T009 and T010 can run in parallel after the foundational runtime seam is in place.
- T015 and T016 can run in parallel because they cover different validation layers.
- T021 and T022 can run in parallel before reset/default-state implementation.
- T027 and T028 can run in parallel before the final quality-gate pass in T029.

---

## Parallel Example: User Story 1

```bash
# After foundational runtime-config work is in place, these can proceed together:
Task: "Add failing HUD rendering and interaction regressions in tests/game/GameApp.web-input.test.ts"
Task: "Add failing parameter-apply mode regressions in tests/physics/PhysicsWorld.test.ts and tests/gameplay/ShotResolver.test.ts"

# Once the tests exist, these can also proceed in parallel:
Task: "Implement interactive parameter panel rendering and control wiring in src/web/ui/WebHudOverlay.ts"
Task: "Apply immediate and next-shot parameter updates in src/physics/PhysicsWorld.ts and src/gameplay/flow/ShotResolver.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Finish Phase 1 and Phase 2.
2. Complete User Story 1 tasks (T009–T014).
3. Validate that one supported parameter can be changed live from the HUD without reload.

### Incremental Delivery

1. Deliver runtime config ownership and live HUD tuning (US1).
2. Add safe validation and failure handling (US2).
3. Add reset/default-state comparison and layout-refresh reset handling (US3).
4. Finish with documentation, cross-story regressions, and full quality gates.

### Team Strategy

1. One developer can own the runtime-config seam and physics refresh pipeline (T001–T008).
2. After Phase 2, a second developer can focus on HUD UI work while another handles physics/apply-mode behavior.
3. Reset/default-state work should begin only after the validation pipeline is stable.

---

## Notes

- `[P]` means the task can be worked on in parallel if staffing allows.
- `[US1]`, `[US2]`, and `[US3]` map directly to the user stories in `specs/008-physics-hud-config/spec.md`.
- Every story phase is designed to be independently testable before moving to the next one.
- `/speckit.analyze` is required after this file is generated and before `/speckit.implement`.
