# Data Model: Table Layout

This feature primarily introduces a consistent “table layout” definition shared between rendering and physics.

## Entities

### TableLayout

- **railThickness**: Visual thickness of the wooden rail/border.
- **feltRect**: The playable felt rectangle (derived from the table size and rail thickness).
- **pockets**: Six pocket definitions.

### Pocket

- **id**: One of `topLeft`, `topMiddle`, `topRight`, `bottomLeft`, `bottomMiddle`, `bottomRight`.
- **center**: 2D position.
- **visualRadius**: Radius used for drawing the hole.
- **captureRadius**: Radius used for pocket capture in physics.

## Invariants

- The pocket **visual center** and **capture center** must match.
- `captureRadius` should be large enough to feel fair but small enough to avoid accidental pockets.
- The felt rectangle must not overlap the wood rail region (clear visual separation).

