# Implementation Plan: Chinese 8-Ball Opening Rules

**Branch**: `007-chinese-eight-ball` | **Date**: 2026-04-21 | **Spec**: `specs/007-chinese-eight-ball/spec.md`
**Input**: Feature specification from `specs/007-chinese-eight-ball/spec.md`

## Summary

Expand the current demo match flow into a Chinese 8-ball opening-rules flow: build a full 16-ball legal rack, validate opening-break outcomes, support break-foul follow-up choices, allow mixed first-pot group selection, and enforce legal black-8 win conditions. The implementation should keep rule decisions inside gameplay/session layers, extend physics-shot telemetry only where needed for break evaluation, and add UI/input seams only for player choices that cannot be auto-resolved.

## Technical Context

**Language/Version**: TypeScript 5.9 (`tsc`)  
**Primary Dependencies**: No runtime third-party libraries; dev/test tooling uses Vite 7 and Vitest 3  
**Storage**: N/A (in-memory match/session state only)  
**Testing**: Vitest (`npm test`), plus repo quality gates `npm run lint` and `npm run build`  
**Target Platform**: WeChat mini game runtime + Web debug/runtime (`npm run dev:web`)  
**Project Type**: Single-project 2D billiards game demo  
**Performance Goals**: Preserve current 60 FPS render experience and 120 Hz fixed-step physics loop while handling a full 16-ball rack  
**Constraints**: No new dependencies; preserve layer boundaries; keep `dev:web` and mini-game compatibility; maintain observable logs for rule-resolution branches; avoid embedding rule decisions in render/UI  
**Scale/Scope**: One local match session, one active shot at a time, 16 balls on table, one pending player decision at a time (break-foul option or mixed-pot group choice)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Test-First**: Implementation should begin by expanding `RuleEngine`, `GameSession`, `RoundResolver`, `PhysicsWorld`, and `GameApp` tests for the new rack/rule paths before changing logic.
- ✅ **Layer Boundaries**: Rack generation belongs in game bootstrap / helper utilities; rule evaluation stays in `src/gameplay/rules` and `src/gameplay/session`; render/UI only presents pending decisions and state.
- ✅ **Observability**: Preserve/add logs for rack creation, break evaluation, pending decision creation/resolution, black-8 respot, and round settlement branches.
- ✅ **Quality Gates**: Plan assumes `npm run lint`, `npm test`, and `npm run build` are run before implementation is considered complete.
- ✅ **Backward Compatibility**: Web debug controls and WeChat runtime should continue to boot and play; new choices must degrade cleanly if only the Web path exposes extra controls first.
- ✅ **README Sync**: Because this is a user-visible rules expansion, implementation must update `README.md` with the new Chinese 8-ball rule coverage.
- ✅ **Post-Tasks Analyze**: After `/speckit.tasks`, `/speckit.analyze` remains mandatory before `/speckit.implement`.

**Post-Design Re-check**: Planned artifacts keep rules in gameplay/session layers, limit UI work to explicit player-choice prompts, and do not require constitution exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/007-chinese-eight-ball/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chinese-eight-ball-rule-flow.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/
│   ├── GameConfig.ts              # Table dimensions; likely rack spot / break-line geometry home
│   └── RuleConfig.ts              # Rule toggles/constants; best seam for break thresholds and options
├── game/
│   ├── GameApp.ts                 # Match bootstrap, shot accumulation, debug hooks, state transitions
│   └── scenes/
│       ├── MatchScene.ts
│       └── ResultScene.ts
├── gameplay/
│   ├── flow/
│   │   ├── RoundResolver.ts       # Round settlement pipeline and table mutations
│   │   └── ShotResolver.ts
│   ├── rules/
│   │   └── RuleEngine.ts          # Break validation, group assignment, black-8 legality
│   └── session/
│       └── GameSession.ts         # Match state, groups, pending choices, winner/turn updates
├── input/
│   └── InputManager.ts            # New intents if player choices become explicit interactions
├── physics/
│   ├── PhysicsWorld.ts            # Collision/rail/pocket telemetry for break evaluation
│   └── body/BallBody.ts           # Ball identities and type model
└── web/
    └── ui/
        └── WebControls.ts         # Optional first UI surface for break/group-choice actions

tests/
├── game/
│   └── GameApp.web-input.test.ts
├── gameplay/
│   ├── GameSession.test.ts
│   ├── RoundResolver.test.ts
│   ├── RuleEngine.test.ts
│   └── ShotResolver.test.ts
└── physics/
    └── PhysicsWorld.test.ts
```

**Structure Decision**: Keep the existing single-project structure. Add a rack-building seam near `GameApp`/config, extend `PhysicsWorld` only to expose rule-needed break telemetry, keep rule adjudication in `RuleEngine`, persist pending choices and session transitions in `GameSession`, and use `WebControls`/`InputManager` only where human choice is required.

## Complexity Tracking

No constitution violations currently identified; this section remains intentionally empty.
