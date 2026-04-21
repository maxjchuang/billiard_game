# Research: Table Wood Rails + Six Pockets

## Decision 1: Single source of truth for table layout

**Decision**: Introduce a shared “table layout” definition (rail thickness + pocket geometry) that both physics and renderer use.

**Rationale**: The current renderer draws the felt inset (`TableRenderer` uses a fixed 20px inset) while physics and ball rendering operate on the full `0..width/0..height` space. This mismatch is the root cause of “UI looks wrong” and will also make pockets/rails inconsistent if we only draw visuals.

**Alternatives considered**:

- Draw pockets/rails purely visually without changing physics
  - Rejected because it fails the requirement that visuals and pocketing feel consistent.
- Expand the canvas to render wood outside the physics bounds
  - Rejected because it requires broader changes to sizing/camera/layout.

## Decision 2: Pocket positions

**Decision**: Render and simulate 6 pockets in the standard layout (4 corners + 2 side middles) derived from the shared layout.

**Rationale**: Matches user expectation and the existing physics intent (already has 6 pockets).

**Alternatives considered**:

- Keep pocket centers exactly on the canvas corners/edges
  - Acceptable, but makes full circular holes hard to render (centers at 0/width/height produce cropped circles).

## Decision 3: Visual layering

**Decision**: Render wood rails and pocket holes in `TableRenderer` (behind balls) for the first iteration.

**Rationale**: Minimal change and preserves rendering order. Still makes holes clearly visible when not overlapped.

**Alternatives considered**:

- Add a “pocket mask” layer rendered after balls to visually hide balls when they enter the hole
  - Potential follow-up if we want stronger “drop into hole” feedback. Not required for MVP.

## Decision 4: Performance and compatibility

**Decision**: Use simple Canvas 2D primitives (rectangles + circles + gradients only if cheap) and avoid browser-only APIs outside web entrypoints.

**Rationale**: Maintain 60fps and avoid regressions in WeChat mini game runtime.

