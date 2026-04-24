# Implementation Plan: 物理参数实时 HUD 配置

**Branch**: `008-physics-hud-config` | **Date**: 2026-04-23 | **Spec**: `specs/008-physics-hud-config/spec.md`
**Input**: Feature specification from `specs/008-physics-hud-config/spec.md`

**Note**: Updated by `/speckit.plan` after the spec added `FR-013`, which requires `web-hud-overlay` and `boot-status` element boundaries to remain non-overlapping.

## Summary

Refine the existing `dev:web` physics HUD plan so the runtime tuning UI not only avoids obscuring gameplay-critical table content, but also guarantees explicit layout separation between the `web-hud-overlay` panel and the `boot-status` element. The implementation continues to use an application-owned runtime physics config, a DOM-based HUD overlay, and a shared layout-refresh path, while adding a stricter layout rule, a measurable collision check between overlay rectangles, and regression coverage that fails if the two DOM elements overlap.

## Technical Context

**Language/Version**: TypeScript 5.9 (`package.json`)  
**Primary Dependencies**: Vite 7.x for web dev/build, Vitest 3.x for tests, Canvas 2D plus native DOM UI  
**Storage**: N/A — runtime-only configuration, no persistence in v1  
**Testing**: Vitest via `npm test` plus TypeScript no-emit lint via `npm run lint`  
**Target Platform**: Browser `dev:web` debug UI with WeChat mini game compatibility preserved  
**Project Type**: Single-repo billiards demo spanning gameplay, physics, rendering, and Web debug UI  
**Performance Goals**: Keep the fixed-step simulation stable and avoid noticeable degradation to the current 60 FPS web experience  
**Constraints**: DOM logic stays in `src/web/*`; physics/runtime consistency must hold after live parameter edits; `web-hud-overlay` and `boot-status` boundaries must not overlap in supported states; merge requires `npm run lint`, `npm test`, and `npm run build`; public usage notes stay synchronized in `README.md`  
**Scale/Scope**: One focused refinement touching spec-driven artifacts and the existing Web HUD / boot status layout and regression tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Test-First**: Add a failing DOM/layout regression that checks `web-hud-overlay` and `boot-status` element boundaries do not intersect before adjusting implementation.
- **2. Layer Boundaries**: DOM boundary measurement and placement logic stay in `src/web/*`; application state remains in `GameApp`; render/physics layers continue to read state only.
- **3. Observability**: Keep existing apply/reset/reject logs and add traceable layout-status signals if runtime placement decisions change.
- **4. Quality Gates**: Re-run `npm run lint`, `npm test`, and `npm run build` after the layout change.
- **5. Backward Compatibility**: Avoid introducing DOM assumptions into non-Web entry points; the mini-game path must remain unaffected.
- **6. README Sync**: If user-visible HUD placement behavior changes, keep `README.md` guidance aligned.
- **7. Clarify Before Plan**: Clarification is already resolved in the spec; the new requirement is explicit in `FR-013`.
- **8. Visual Non-Overlap**: The design must define concrete boundary-separation rules for `web-hud-overlay` and `boot-status`, not just “generally non-obstructive” behavior, and must cover collapsed, expanded, validation-error, responsive, and long-copy states. For this feature, broader HUD safety for the table, HUD toggle entry, and HUD error region is verified through named scenario regressions rather than a single rectangle model for every visible element.
- **9. Analyze After Tasks**: After task updates, `/speckit.analyze` must run before any new implementation pass.

## Project Structure

### Documentation (this feature)

```text
specs/008-physics-hud-config/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── physics-hud-runtime-config.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/
│   ├── PhysicsConfig.ts
│   └── RenderConfig.ts
├── game/
│   └── GameApp.ts
├── gameplay/
│   └── flow/
│       └── ShotResolver.ts
├── physics/
│   └── PhysicsWorld.ts
├── render/
│   ├── Renderer.ts
│   └── layers/
│       ├── TableRenderer.ts
│       └── UIRenderer.ts
├── shared/
│   └── TableLayout.ts
└── web/
    ├── ui/
    │   ├── WebControls.ts
    │   └── WebHudOverlay.ts
    └── web.ts

tests/
├── core/
│   ├── TableLayout.test.ts
│   └── WebControlAvailability.test.ts
├── game/
│   └── GameApp.web-input.test.ts
├── gameplay/
│   └── ShotResolver.test.ts
└── physics/
    └── PhysicsWorld.test.ts
```

**Structure Decision**: Keep the existing single-project layout. The new work remains concentrated in Web UI placement, shared HUD state, and tests that can assert DOM boundary separation without moving responsibilities across layers.

## Implementation Phases

### Phase 0 — Research & Decisions

- Preserve the existing single-source runtime physics configuration and current parameter apply-mode design.
- Define a deterministic placement rule between `web-hud-overlay` and `boot-status`, including default anchor priority and fallback spacing behavior when both elements are visible.
- Choose a testable boundary model for regression tests, using element rectangles or equivalent layout metadata rather than visual inspection only.

### Phase 1 — Design

- Extend the Web HUD design so `web-hud-overlay` can detect or reserve `boot-status` space before finalizing its own position.
- Document the exact non-overlap rule in planning artifacts: `boot-status` remains readable, `web-hud-overlay` remains reachable, and their `element.boundary` rectangles do not intersect.
- Define updated regression coverage in `tests/core/WebControlAvailability.test.ts` and/or `tests/game/GameApp.web-input.test.ts` for expanded, collapsed, narrow-window, validation-error, and long-copy states, while also checking that the HUD toggle entry, HUD error region, and table-critical viewing area remain usable in those named scenarios.
- Keep layout safety localized to `src/web/*`, with no new rule logic added to physics or renderer layers.

### Phase 2 — Task Breakdown (created by `/speckit.tasks`)

- Add or update tasks for the stricter `web-hud-overlay` vs `boot-status` non-overlap acceptance rule and for the named non-obstruction scenarios required by `FR-010`.
- Add failing tests that assert explicit rectangle separation, not only “non-obstructive” general behavior, including validation-error and long-copy states.
- Update implementation tasks to include placement logic, spacing constants, and any status-region coordination needed in Web HUD code.
- Re-run lint, tests, and build after the fix.

## Post-Design Constitution Re-Check

- The design still satisfies test-first, layer-boundary, observability, and backward-compatibility rules.
- The updated layout rule now makes `Visual Non-Overlap` concrete for `web-hud-overlay` and `boot-status`, while named-scenario regressions cover the remaining HUD-safe regions required by `FR-010`.
- No constitution exemptions are required.

## Complexity Tracking

No constitution violations anticipated.
