# Research: Chinese 8-Ball Opening Rules

**Branch**: `007-chinese-eight-ball`  
**Created**: 2026-04-21  
**Spec**: `specs/007-chinese-eight-ball/spec.md`

## Decisions

### Decision 1: Extract full opening rack creation from `GameApp.startMatch` into a dedicated rack builder

- **Decision**: Replace the current hard-coded 4-ball demo setup with a dedicated rack-construction helper that creates the full 16-ball opening layout and applies mandatory Chinese 8-ball positioning rules.
- **Rationale**: `GameApp.startMatch()` currently hard-codes cue + 1 solid + 1 stripe + black, which is too limited for legal rack validation and makes restart behavior brittle. A dedicated builder keeps rack geometry isolated from match boot logic and supports repeated resets safely.
- **Alternatives considered**:
  - Keep rack creation inline in `GameApp`: simpler initially, but quickly becomes hard to test and easy to break when geometry/rule constraints change.
  - Push rack creation into rendering or scene code: violates layer boundaries because rack legality is gameplay state, not presentation.

### Decision 2: Extend shot/physics telemetry specifically for opening-break evaluation instead of embedding break rules into physics

- **Decision**: Extend the per-shot frame/context data so round settlement can know whether the shot is the opening break, how many object balls contacted rails, and whether a ball left the table; keep the actual break-valid/foul decision in `RuleEngine`.
- **Rationale**: Chinese 8-ball opening-break legality depends on shot outcomes that current `ShotContext` does not capture. Physics should report facts; rules should interpret them.
- **Alternatives considered**:
  - Judge break legality directly inside `PhysicsWorld`: would mix simulation with game rules and make future rule variants harder.
  - Infer break legality only from pocketed balls: insufficient because the spec also requires the “≥4 object balls hit rails” path and foul variants such as fly-off-table.

### Decision 3: Model unresolved player decisions explicitly in session state

- **Decision**: Add an explicit pending-decision state in `GameSession`/`RoundResult` for two cases: opponent response after a break foul, and current-player group selection after a legal mixed first pot.
- **Rationale**: The current model only supports immediate outcomes (`assignedGroup`, next player, foul, winner). Chinese 8-ball introduces rule branches that must wait for player input, so the session model needs a first-class “decision required” state.
- **Alternatives considered**:
  - Auto-pick a default option after break fouls or mixed pots: contradicts the spec and removes player agency.
  - Handle choices only in UI local state: unsafe because gameplay state would become desynchronized across Web/debug and mini-game paths.

### Decision 4: Make round settlement multi-phase so black-8 respot and break-foul options are represented cleanly

- **Decision**: Refactor round settlement so it can (a) inspect raw shot facts, (b) compute rule decisions, (c) apply table mutations such as black-8 respot, and (d) persist pending-choice or turn state transitions in a deterministic order.
- **Rationale**: The current `RoundResolver` pockets balls before rule resolution, which is too rigid for Chinese 8-ball break rules. A multi-phase settlement avoids ad-hoc rollback logic.
- **Alternatives considered**:
  - Keep current one-pass settlement and patch in exceptions: highest short-term speed, but likely to create fragile special cases around black-8 and break-foul acceptance.
  - Move all mutations into `RuleEngine`: would make the rule engine impure and harder to unit test.

### Decision 5: Keep the first implementation UI-light, using Web controls/debug hooks for player choices

- **Decision**: Introduce only the minimum input/UI surface needed to resolve pending decisions, prioritizing reusable `InputIntent` actions and Web debug controls first.
- **Rationale**: The feature is rule-heavy; the main risk is gameplay correctness, not polished UI. Minimal controls keep scope aligned while still enabling real interactive choice flows.
- **Alternatives considered**:
  - Build a larger in-match rules panel immediately: more discoverable, but expands scope into UI redesign.
  - Avoid interactive choices and rely only on tests/debug APIs: blocks real user flows for required rule branches.
