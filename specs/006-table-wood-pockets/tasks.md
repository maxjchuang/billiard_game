---

description: "Tasks for table wood rails and six pockets"
---

# Tasks: Table Wood Rails + Six Pockets

**Input**: Design documents from `specs/006-table-wood-pockets/`  
**Prerequisites**: `specs/006-table-wood-pockets/plan.md`, `specs/006-table-wood-pockets/spec.md`, `specs/006-table-wood-pockets/research.md`, `specs/006-table-wood-pockets/data-model.md`

**Analyze (Required)**: After generating `tasks.md`, run `/speckit.analyze` and provide the report in 中文 before `/speckit.implement`.

**Notes from clarifications**:

- Shared layout source of truth (physics + render) with `railThickness = 20`.
- Pocket centers are inset by `railThickness`.
- Pockets are drawn in the table layer (behind balls); no masking/drop animation in v1.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Define shared layout constants and ensure baseline tests cover them.

- [ ] T001 Add table layout constants in `src/config/PhysicsConfig.ts` (railThickness=20, pocketVisualRadius, pocketCaptureRadius if needed)
- [ ] T002 Add render layout constants in `src/config/RenderConfig.ts` (wood/rail styling + pocket colors if needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create a single source of truth for table geometry used by physics and rendering.

- [ ] T003 Create a shared helper in `src/shared/TableLayout.ts` to compute `feltRect` and 6 pocket centers from `width/height/railThickness`
- [ ] T004 Update `src/physics/PhysicsWorld.ts` to derive rail collision bounds and pocket centers from `TableLayout` (remove hardcoded edge pockets)
- [ ] T005 Update `src/render/layers/TableRenderer.ts` to draw: wood rail border + felt rect using `TableLayout` (remove the fixed 20px inset)
- [ ] T006 Add/adjust unit tests for `TableLayout` in `tests/core/TableLayout.test.ts`

---

## Phase 3: User Story 1 - 桌面外观一眼可辨 (Priority: P1) 🎯 MVP

**Goal**: Make wood rails and 6 pockets clearly visible.

**Independent Test**: Run `npm run dev:web` and visually confirm wood rails + 6 pockets are clearly visible.

### Implementation for User Story 1

- [ ] T007 [US1] Draw 6 pocket holes (circles) inside `src/render/layers/TableRenderer.ts` using pocket centers from `TableLayout`
- [ ] T008 [US1] Tune colors/contrast in `src/config/RenderConfig.ts` so pockets are distinguishable from felt and wood

---

## Phase 4: User Story 2 - 球洞位置与落袋结果一致 (Priority: P2)

**Goal**: Ensure pocket visuals and pocketing feel consistent.

**Independent Test**: Shoot a ball into a visible pocket; observe that the ball pockets when crossing the visible hole region.

### Implementation for User Story 2

- [ ] T009 [US2] Ensure `pocketCaptureRadius` in `src/config/PhysicsConfig.ts` matches the rendered pocket radius/geometry and feels fair
- [ ] T010 [US2] Update/extend physics tests in `tests/physics/PhysicsWorld.test.ts` to cover pocketing near inset pocket centers

---

## Phase 5: User Story 3 - 不同屏幕/窗口下都清晰可见 (Priority: P3)

**Goal**: Keep table + pockets clear across common window sizes.

**Independent Test**: Resize the browser window; verify 6 pockets remain visible and not covered by HUD.

### Implementation for User Story 3

- [ ] T011 [US3] Verify/adjust `src/render/Renderer.ts` and HUD height handling so the table region (including pockets) is not obscured
- [ ] T012 [US3] Add a lightweight web rendering regression check in `tests/web/PagesBuildArtifacts.test.ts` or a new web test that asserts TableLayout constants are exported/used

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T013 [P] Add/adjust logs for table render/layout decisions in `src/render/layers/TableRenderer.ts`
- [ ] T014 Update `README.md` to mention the improved table visuals and how to preview via `npm run dev:web`
- [ ] T015 Run `npm run lint`, `npm test`, `npm run build`, `npm run build:web` locally and fix any failures

---

## Dependencies & Execution Order

- Phase 2 blocks all user stories (shared layout must exist first).
- After Phase 2:
  - US1 can proceed immediately (pure rendering).
  - US2 depends on physics + layout correctness.
  - US3 is mostly verification/adjustment.

## Parallel Opportunities

- [P] tasks can be done in parallel (logging + README), after core layout is in place.

