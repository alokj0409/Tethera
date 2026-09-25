# TETHERA Architecture Decision Log

This is an append-only record. Existing decisions may be superseded by a later entry but are not rewritten or removed.

## ADR-001 — Canvas 2D as the single rendering surface

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Render the complete game and HUD on a single programmatic Canvas 2D surface. Use CSS only for the full-viewport host, letterboxing, and safe-area containment. |
| Options considered | Canvas 2D; SVG; a mixture of Canvas for play and DOM/SVG for the HUD. |
| Rationale | The build order explicitly starts with a DPR-aware canvas, all visuals are geometric, and one surface keeps the fixed logical coordinate system, recoil, and collision debug views aligned without dependencies. |
| Consequences | Text and controls must be drawn or mapped carefully for accessibility; resize and pointer coordinates need explicit logical-space transforms; there will be no DOM layout engine for in-game HUD elements. |

## Decision policy

Future entries are required for choices not pinned down by `PRD.md`, including fixed-step details, close-anchor safeguards, Poisson-disc behavior when capacity is insufficient, boundary behavior, moving-target paths, bouncer collision response, wormhole cooldown/orientation, and pulsar force timing.

## ADR-002 — Scale the Canvas backing store to displayed pixels

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Size the backing store to `logical size * aspect-fit scale * devicePixelRatio`, then set the drawing transform to `aspect-fit scale * devicePixelRatio`. Keep safe-area padding outside the logical canvas. |
| Options considered | A fixed `390 x 844` backing store; logical size times DPR only; displayed size times DPR. |
| Rationale | Matching actual display pixels keeps strokes sharp both below and above a scale of 1, while the transformed context lets every renderer and physics system remain in PRD logical coordinates. External safe-area padding prevents platform insets from changing gameplay coordinates. |
| Consequences | A resize recreates and clears the backing store, so the current scene must be redrawn immediately. Very high DPR devices allocate proportionally more pixels; a future performance pass may add a documented cap if measurements require it. |
