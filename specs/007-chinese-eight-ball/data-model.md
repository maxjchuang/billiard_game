# Data Model: Chinese 8-Ball Opening Rules

**Branch**: `007-chinese-eight-ball`  
**Created**: 2026-04-21  
**Spec**: `specs/007-chinese-eight-ball/spec.md`

## Entity: RackLayout

Represents the canonical opening rack generated for a new match or restart.

### Fields

- `cueBall`: the single white ball placed behind the break line
- `objectBalls`: 15 target balls (`7` solids, `7` stripes, `1` black)
- `apexSpot`: table coordinate on the center line, `635mm` from the top cushion in rule space
- `rows`: five rack rows arranged as `1,2,3,4,5`
- `isTight`: whether all adjacent rack contacts are gap-free within game tolerance

### Validation Rules

- The rack must always contain exactly `1` cue, `7` solids, `7` stripes, and `1` black
- The apex ball center must align to the rack spot
- Ball `8` must occupy the center position of row three
- Bottom-corner object balls must be split across solid/stripe
- Rack generation must be deterministic enough to validate mandatory placements but may randomize remaining legal balls

### State Transitions

- `uninitialized -> ready`: new match or restart builds a legal rack
- `ready -> invalid`: only reachable in tests/debug checks when constraints fail

## Entity: BreakTelemetry

Captures the opening-shot facts needed for rule adjudication.

### Fields

- `isOpeningBreak`: whether the shot is the first legal shot of the rack
- `firstHitBallId`: first object ball struck by the cue ball, or `null`
- `pocketedBallIds`: balls pocketed during the shot
- `cueBallPocketed`: whether the cue ball scratched
- `blackBallPocketed`: whether the black 8 was pocketed
- `objectBallRailContacts`: count of distinct target balls that reached a rail during the break
- `ballsOffTable`: ids of balls that left the table surface
- `cueBallStartedBehindBreakLine`: whether cue-ball placement was legal before impact

### Validation Rules

- `objectBallRailContacts` counts only target balls, not the cue ball
- `ballsOffTable` must not include already pocketed balls
- `cueBallStartedBehindBreakLine=false` immediately invalidates break readiness

## Entity: PendingDecision

Represents a rule branch that cannot resolve until a player chooses an option.

### Variants

- `break-foul-option`
  - options: `behind-line-ball-in-hand`, `re-rack`, `accept-table`
  - actor: non-breaking player
- `group-selection`
  - options: `solid`, `stripe`
  - actor: current shooting player after a legal mixed first pot

### Validation Rules

- Only one pending decision may exist at a time
- While a pending decision exists, the next shot cannot start
- Applying a decision must clear the pending state and log the chosen branch

### State Transitions

- `none -> pending`: break foul or mixed first pot produces a choice
- `pending -> resolved`: player chooses one option
- `resolved -> none`: session returns to normal aiming flow

## Entity: GroupAssignment

Stores each player’s current target-ball ownership.

### Fields

- `player1Group`: `solid | stripe | unassigned`
- `player2Group`: `solid | stripe | unassigned`
- `assignmentReason`: `single-first-pot | mixed-first-pot-choice | none`

### Validation Rules

- Players can never share the same assigned group
- Assignment remains `unassigned/unassigned` until the first legal scoring assignment is finalized

## Entity: RoundOutcome

Represents the result of applying break rules or normal turn rules to one shot.

### Fields

- `foul`: whether the shot is a foul
- `foulReasons`: normalized rule reason list
- `keepTurn`: whether shooter keeps the table immediately
- `nextPlayer`: player who acts after settlement or pending decision
- `assignedGroup`: optional immediate group assignment
- `pendingDecision`: optional unresolved player choice
- `respottedBallIds`: optional list of balls returned to the table (notably black on break)
- `gameOver`: whether the match ended
- `winner`: winning player id or `null`

### Validation Rules

- `winner` must be `null` unless `gameOver=true`
- `respottedBallIds` must contain only balls that were pocketed during the shot
- `pendingDecision` and `gameOver=true` should not coexist for this feature scope
