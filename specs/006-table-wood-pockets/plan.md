# Implementation Plan: Table Wood Rails + Six Pockets

**Branch**: `006-table-wood-pockets` | **Date**: 2026-04-21 | **Spec**: `specs/006-table-wood-pockets/spec.md`
**Input**: Feature specification from `specs/006-table-wood-pockets/spec.md`

## Summary

Make the billiard table UI clearly show a wooden rail/border and 6 pockets (4 corners + 2 side middles), and ensure the pocket visuals align with the pocketing (physics) results so players do not see “went in but didn’t count / didn’t go in but counted”.

## Technical Context

**Language/Version**: TypeScript 5.9 (`package.json`)  
**Primary Dependencies**: Vite 7.x (web build), Canvas 2D rendering  
**Storage**: N/A  
**Testing**: Vitest 3.x (`npm test`)  
**Target Platform**: Web (debug build) + WeChat mini game (must not regress)  
**Project Type**: Game (logic + physics + renderer)  
**Performance Goals**: Maintain smooth rendering (target 60fps)  
**Constraints**: Keep layer boundaries (physics vs render vs UI) and keep existing flows working  
**Scale/Scope**: Single table scene; visual enhancements + consistency improvements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Test-First**: Add/adjust automated tests to cover new table layout constants and pocket visualization consistency.
- **2. Layer Boundaries**: Pocketing logic remains in physics; render reads shared layout constants only (no game rule decisions in render).
- **3. Observability**: Keep/extend logs for key events (render table; ball-pocketed already logged).
- **4. Quality Gates**: Ensure `npm run lint`, `npm test`, `npm run build` pass before merging.
- **5. Backward Compatibility**: Web-only rendering changes must not break WeChat runtime; avoid browser-only APIs outside `src/web/*`.
- **6. README 同步**: Update `README.md` to mention the improved table UI (wood rails + 6 pockets) and how to preview via `dev:web`.
- **7. Analyze After Tasks**: After `/speckit.tasks`, run `/speckit.analyze` (Chinese report) before `/speckit.implement`.

## Project Structure

### Documentation (this feature)

```text
specs/006-table-wood-pockets/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/
│   ├── GameConfig.ts
│   ├── PhysicsConfig.ts
│   └── RenderConfig.ts
├── physics/
│   └── PhysicsWorld.ts
└── render/
    ├── Renderer.ts
    └── layers/
        └── TableRenderer.ts

tests/
├── physics/
│   └── PhysicsWorld.test.ts
└── web/
    └── PagesBuildArtifacts.test.ts
```

**Structure Decision**: Single project. Implement a shared “table layout” concept via config constants (rail thickness, pocket radius/inset) that are used by both `PhysicsWorld` and `TableRenderer`.

## Implementation Phases

### Phase 0 — Research & Decisions

- Decide the authoritative coordinate system for the playable area vs the visual rails.
- Decide pocket visual geometry (radius, shading) and rail thickness so pockets are clearly visible.
- Decide whether to keep pockets rendered behind balls (simple) or add a top “mask” layer (optional enhancement).

### Phase 1 — Design

- Introduce/extend config values representing:
  - rail thickness (wood border width)
  - pocket visual radius
  - pocket center inset (if needed) and how it maps to physics capture radius
- Specify how `PhysicsWorld` rail collisions and pocket centers are derived from the shared layout.
- Specify how `TableRenderer` draws felt, wooden rails, and pockets using the same layout.

### Phase 2 — Task Breakdown (created by `/speckit.tasks`)

- Update rendering (`TableRenderer`) to draw rail + pockets.
- Align physics pocket centers and rail collisions with the visual layout.
- Update tests for pocket/rail layout.
- Update `README.md`.

## Complexity Tracking

No constitution violations anticipated.
