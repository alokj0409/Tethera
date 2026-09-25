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

## ADR-003 — Let the final tether complete on release

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Consume a tether when its anchor is planted, but do not evaluate the zero-tether loss until that active tether is released or cancelled. |
| Options considered | Fail immediately when the counter reaches zero; fail on release; allow indefinite free flight after the final release. |
| Rationale | Immediate failure makes the final allotted tether unusable. Waiting until release preserves a complete press-hold-release opportunity while still enforcing the PRD loss condition before another anchor can be planted. |
| Consequences | A player may hold the final tether indefinitely. If its motion clears the final target, victory takes precedence; otherwise release transitions through `FREE_FLIGHT` to `GAME_OVER`. |

## ADR-004 — Use fixed-step free flight and analytic tether orbits

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Advance simulation at fixed `1/60s` intervals. Integrate untethered position from velocity and update a tethered orb analytically from its fixed radius, angle, and signed tangential speed. Clamp a rendered frame's contributed time to `0.1s`. |
| Options considered | Variable-delta Euler integration; fixed-step constrained Euler integration; fixed-step analytic circular motion. |
| Rationale | The PRD requires a fixed 60 FPS physics step. Analytic angular updates prevent the rigid tether from accumulating radial drift, while signed tangential speed preserves clockwise/counter-clockwise motion exactly. |
| Consequences | With no other forces, tethered paths are circular rather than numerically elliptical. Pulsars will later alter tangential velocity/trajectory under a separately documented force rule. Background-tab time beyond `0.1s` per rendered frame is discarded. |

## ADR-005 — Clamp ultra-close anchors to a 12-unit effective radius

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | If a pointer anchor is less than `12` logical units from the orb center, move its effective physics/render position onto a 12-unit radius whose tangent aligns with incoming velocity. |
| Options considered | Ignore the press; clamp only the divisor while drawing at the pointer; use an arbitrary fixed axis; shift the effective anchor along a velocity-derived radial axis. |
| Rationale | A non-zero geometric radius avoids division by zero and visually matches the simulated tether. Deriving the radial direction from velocity avoids an arbitrary clockwise/counter-clockwise flip and the 12-unit distance separates the 9-unit orb from the 3-unit anchor. |
| Consequences | Ultra-close taps may render up to 12 logical units from the literal pointer position. The whip scalar remains finite, though it can still produce intentionally large speeds after a much longer prior tether. |
