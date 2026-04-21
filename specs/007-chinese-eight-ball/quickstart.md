# Quickstart: Chinese 8-Ball Opening Rules

**Branch**: `007-chinese-eight-ball`  
**Created**: 2026-04-21  
**Spec**: `specs/007-chinese-eight-ball/spec.md`

## Local Setup

- Install dependencies: `npm install`
- Run Web debug mode: `npm run dev:web`
- Quality gates for the implementation phase: `npm run lint`, `npm test`, `npm run build`

## Manual Verification Goals

### 1. Rack validation

- Start a new match and confirm the table contains `16` balls
- Verify the opening rack is a 5-row triangle
- Verify the apex ball sits on the rack spot
- Verify the black 8 is centered in row three
- Verify the two rear-corner balls are one solid and one stripe
- Verify the rack is tight with no visible gaps

### 2. Opening-break validation

- Place the cue ball behind the break line and perform a legal break
- Verify a break is accepted when either one target ball is pocketed or at least four target balls contact rails
- Verify a break foul is raised when fewer than four target balls contact rails and no target ball is pocketed
- Verify cue-ball scratch or fly-off-table on the break is treated as a break foul
- Verify a black-8 pocket on the break respots the black and keeps the shooter at the table

### 3. Group-assignment validation

- Verify the first legal single-group pot assigns that group to the shooter
- Verify a legal first pot containing both solids and stripes prompts the shooter to choose a group
- Verify no group is locked in before that first legal assignment is resolved

### 4. Black-8 win validation

- Verify the shooter cannot legally win by pocketing the black before clearing all assigned balls
- Verify the shooter wins after all assigned balls are cleared and the black is legally struck and pocketed

## Suggested Test Focus

- Unit tests: `tests/gameplay/RuleEngine.test.ts`, `tests/gameplay/GameSession.test.ts`, `tests/gameplay/RoundResolver.test.ts`
- Physics telemetry tests: `tests/physics/PhysicsWorld.test.ts`
- Match/bootstrap integration tests: `tests/game/` and `tests/gameplay/ShotResolver.test.ts`
