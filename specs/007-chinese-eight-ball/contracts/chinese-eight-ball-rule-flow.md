# Contract: Chinese 8-Ball Rule Flow

## Scope

This contract defines the gameplay-layer behavior required to support Chinese 8-ball opening rack rules, opening-break adjudication, player-choice branches, and legal black-8 resolution.

## Contract A: Opening Rack

1. Rack composition
- Exactly `16` balls must exist at match start: `1` cue, `7` solids, `7` stripes, `1` black

2. Rack placement rules
- Object balls must form a 5-row triangle (`1,2,3,4,5`)
- The apex ball center must align to the rack spot
- Ball `8` must occupy row-three center
- The two rear-corner balls must be split across one solid and one stripe
- All rack balls must be tightly packed

3. Reset behavior
- Restarting a match must rebuild the rack from legal defaults rather than reusing mutated table state

## Contract B: Opening-Break Evaluation

1. Break readiness
- The cue ball must start behind the break line before a legal break can begin

2. Legal break outcomes
- A break is valid if at least one target ball is pocketed
- A break is valid if at least four target balls contact rails, even when no target ball is pocketed

3. Break fouls
- A break is a foul when neither valid-break condition is satisfied
- A break is a foul when the cue ball is pocketed
- A break is a foul when the cue ball or an object ball leaves the table

4. Break-foul follow-up
- After a break foul, the opponent must receive a decision set containing exactly:
  - `behind-line-ball-in-hand`
  - `re-rack`
  - `accept-table`

## Contract C: Group Assignment

1. First legal assignment
- The first legal scoring result determines ownership of solids or stripes

2. Mixed first pot
- If the first legal scoring result pockets both a solid and a stripe, the shooter must receive a choice between `solid` and `stripe`
- No automatic assignment is allowed before that choice resolves

## Contract D: Black-8 Resolution

1. Break special case
- If the black 8 is pocketed on the break without ending the game, the black must be respotted to the rack spot and play continues for the breaker

2. Win condition
- A player may only win by legally pocketing the black after all of that player’s assigned object balls are cleared

3. Illegal black
- Pocketing the black before clearing all assigned object balls must not be treated as a legal win

## Contract E: Session Flow

- Rule decisions must be generated in gameplay/session layers, not in rendering code
- While a pending decision exists, the next shot must be blocked
- Decision resolution must be logged and must produce a deterministic next session state
