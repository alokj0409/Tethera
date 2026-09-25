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
