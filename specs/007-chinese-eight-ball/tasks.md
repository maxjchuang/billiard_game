# Tasks: Chinese 8-Ball Opening Rules

**Input**: Design documents from `specs/007-chinese-eight-ball/`  
**Prerequisites**: `specs/007-chinese-eight-ball/plan.md`, `specs/007-chinese-eight-ball/spec.md`, `specs/007-chinese-eight-ball/research.md`, `specs/007-chinese-eight-ball/data-model.md`, `specs/007-chinese-eight-ball/contracts/chinese-eight-ball-rule-flow.md`

**Analyze (Required)**: After generating `tasks.md`, run `/speckit.analyze` and provide the report in 中文 before `/speckit.implement`.

**Tests**: This feature follows the constitution’s test-first requirement, so regression tests are included and should fail before implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared fixtures and constants used across all three user stories.

- [ ] T001 [P] Create reusable Chinese 8-ball rack/shot fixtures in `tests/gameplay/support/chineseEightBallFixtures.ts`
- [ ] T002 [P] Add shared rack-spot, break-line, and break-rule constants in `src/config/GameConfig.ts` and `src/config/RuleConfig.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lock expected behavior with failing tests before modifying the gameplay flow.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T003 [P] Add failing rack bootstrap/restart regressions for a full 16-ball Chinese 8-ball setup in `tests/game/GameApp.web-input.test.ts`
- [ ] T004 [P] Add failing opening-break telemetry and rule regressions in `tests/physics/PhysicsWorld.test.ts` and `tests/gameplay/RuleEngine.test.ts`
- [ ] T005 [P] Add failing pending-decision and black-8 settlement regressions in `tests/gameplay/GameSession.test.ts` and `tests/gameplay/RoundResolver.test.ts`

**Checkpoint**: Shared fixtures, constants, and failing regression coverage are ready.

---

## Phase 3: User Story 1 - Opening rack follows Chinese 8-ball rules (Priority: P1) 🎯 MVP

**Goal**: Starting or restarting a match produces a legal 16-ball Chinese 8-ball rack with the required placements and no gaps.

**Independent Test**: Start a new match and verify the table has 16 balls, a 5-row triangle, the apex on the rack spot, the black 8 centered in row three, split rear corners, and a tight rack.

### Tests for User Story 1 ⚠️

> **NOTE: Complete T003 first and keep it failing until the implementation tasks below are done.**

### Implementation for User Story 1

- [ ] T006 [P] [US1] Implement a full legal rack builder in `src/gameplay/session/createChineseEightBallRack.ts`
- [ ] T007 [US1] Wire legal rack creation into start/restart match bootstrap in `src/game/GameApp.ts`
- [ ] T008 [US1] Update session/reset/debug helpers for full-rack state restoration in `src/gameplay/session/GameSession.ts` and `src/game/GameApp.ts`

**Checkpoint**: User Story 1 is independently playable with a legal opening rack.

---

## Phase 4: User Story 2 - Opening break is judged correctly (Priority: P2)

**Goal**: The opening break correctly validates legal outcomes, fouls, and the special black-8-on-break branch.

**Independent Test**: Exercise legal break, low-rail-count foul, cue-ball foul/fly-off-table, and black-8-on-break scenarios and confirm the result handling matches the spec.

### Tests for User Story 2 ⚠️

> **NOTE: Complete T004 first and keep it failing until the implementation tasks below are done.**

### Implementation for User Story 2

- [ ] T009 [P] [US2] Extend per-shot telemetry with opening-break facts in `src/physics/PhysicsWorld.ts` and `src/gameplay/session/GameSession.ts`
- [ ] T010 [US2] Implement break-valid, break-foul, and black-8 respot resolution in `src/gameplay/rules/RuleEngine.ts` and `src/gameplay/flow/RoundResolver.ts`
- [ ] T011 [US2] Add break-foul choice state handling and shot blocking in `src/gameplay/session/GameSession.ts`, `src/input/InputManager.ts`, and `src/game/GameApp.ts`
- [ ] T012 [US2] Add observability logs for break validation, foul-option creation, rejection paths, and black-8 respot handling in `src/gameplay/rules/RuleEngine.ts`, `src/gameplay/flow/RoundResolver.ts`, and `src/gameplay/session/GameSession.ts`

**Checkpoint**: User Story 2 independently resolves opening-break outcomes according to Chinese 8-ball rules.

---

## Phase 5: User Story 3 - Group assignment and black-8 victory follow the rules (Priority: P3)

**Goal**: The first legal pot assigns groups correctly, mixed first pots prompt a player choice, and the black 8 only wins legally after all assigned balls are cleared.

**Independent Test**: Verify single-group first pot, mixed first pot with user choice, illegal early black-8 attempts, and legal black-8 wins after clearing the assigned group.

### Tests for User Story 3 ⚠️

> **NOTE: Complete T005 first and keep it failing until the implementation tasks below are done.**

### Implementation for User Story 3

- [ ] T013 [P] [US3] Implement first-legal-pot group assignment and mixed-pot pending choice in `src/gameplay/rules/RuleEngine.ts` and `src/gameplay/session/GameSession.ts`
- [ ] T014 [US3] Add minimal Web/debug controls for break-option and group-choice actions in `src/web/ui/WebControls.ts`, `src/web/input/mapWebControlAction.ts`, and `src/input/InputManager.ts`
- [ ] T015 [US3] Enforce legal versus illegal black-8 victory flow with pending-choice gating in `src/gameplay/flow/RoundResolver.ts`, `src/gameplay/rules/RuleEngine.ts`, and `src/game/GameApp.ts`
- [ ] T016 [US3] Add observability logs for mixed-pot choice creation/resolution and legal versus illegal black-8 outcomes in `src/gameplay/rules/RuleEngine.ts`, `src/gameplay/session/GameSession.ts`, and `src/game/GameApp.ts`

**Checkpoint**: User Story 3 independently supports correct group ownership and black-8 win/loss outcomes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize user-facing documentation and run full validation across the completed feature.

- [ ] T017 [P] Update Chinese 8-ball rule coverage and new player-choice controls in `README.md`
- [ ] T018 Run quality gates for the feature using scripts in `package.json` (`npm run lint`, `npm test`, `npm run build`) and verify impacted paths under `src/` and `tests/`
- [ ] T019 Validate manual scenarios in `specs/007-chinese-eight-ball/quickstart.md`, including the 10-second rack verification from `SC-001`, and record verification notes in `specs/007-chinese-eight-ball/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) starts immediately.
- Foundational (Phase 2) depends on Setup and blocks all story work.
- User Story phases depend on Phase 2 completion.
- Polish (Phase 6) depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 and delivers the MVP legal rack.
- **US2 (P2)**: Starts after Phase 2 and depends on the legal rack from US1 being available in practice.
- **US3 (P3)**: Starts after Phase 2 but is safest after US2 because pending decision flow is shared with break-foul choices.

### Task Flow

- T001–T002 → T003–T005 → T006–T008 → T009–T012 → T013–T016 → T017–T019

---

## Parallel Opportunities

- T001 and T002 can run in parallel because they touch separate test and config files.
- T003, T004, and T005 can run in parallel once the shared fixtures/constants exist.
- T006 and T009 can run in parallel after foundational tests land because they touch separate rack-building and telemetry seams.
- T013 and T014 can run in parallel after the pending-decision model is defined.
- T017 can run in parallel with final validation prep before T018.

---

## Parallel Example: User Story 2

```bash
# After foundational tests are in place, these can proceed together:
Task: "Implement opening-break telemetry in src/physics/PhysicsWorld.ts and src/gameplay/session/GameSession.ts"
Task: "Prepare break-rule fixtures/assertions in tests/physics/PhysicsWorld.test.ts and tests/gameplay/RuleEngine.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Finish Phase 1 and Phase 2.
2. Complete User Story 1 tasks (T006–T008).
3. Validate legal rack generation independently before moving on.

### Incremental Delivery

1. Deliver legal rack creation (US1).
2. Add opening-break adjudication and black-8-on-break handling (US2).
3. Add group-choice flow and legal black-8 victory enforcement (US3).
4. Finish with README sync and full quality gates.

### Team Strategy

1. One developer owns shared fixtures/constants and foundational regressions.
2. After Phase 2, rack/bootstrap work and break telemetry work can proceed in parallel.
3. Group-choice UI/input work should begin only after the pending-decision model is stable.

---

## Notes

- `[P]` means the task can be worked on in parallel if staffing allows.
- `[US1]`, `[US2]`, and `[US3]` map directly to the user stories in `specs/007-chinese-eight-ball/spec.md`.
- Every story phase is designed to be independently testable before moving to the next one.
- `/speckit.analyze` is required after this file is generated and before `/speckit.implement`.
