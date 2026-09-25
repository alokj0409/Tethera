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

## ADR-006 — Position Canvas HUD glyphs individually for tracking

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Draw uppercase HUD strings one glyph at a time with spacing equal to `fontSize * 0.12`, using only the specified system-monospace fallback stack. |
| Options considered | Rely on Canvas `letterSpacing`; omit tracking; position each glyph manually. |
| Rationale | Canvas `letterSpacing` support is not consistent enough across the target mobile range, while manual placement implements the PRD's `+0.12em` typography without a font asset or DOM overlay. |
| Consequences | Text measurement and alignment require a small custom renderer. HUD strings are short, so the additional per-frame glyph calls remain negligible and will be checked in the final performance pass. |

## ADR-007 — Use swept contacts and give hazards same-step precedence

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Test each fixed-step orb-center segment against expanded target circles and orb-radius capsules around the exact rendered triangle edges. Resolve a hazard hit before any target contacts from the same step. |
| Options considered | Endpoint-only overlap; swept point tests; adaptive sub-stepping; final-target victory before hazards; hazard before target. |
| Rationale | Swept tests prevent ordinary straight-line tunneling without increasing the global simulation rate. Matching the visual triangle prevents invisible collision margins. A lethal obstacle should not be negated by simultaneously touching the final target. |
| Consequences | Extremely high angular velocity can trace a curved arc that differs materially from its one-step chord; adaptive collision sub-stepping remains a final performance/robustness task. Targets touched on a hazard-loss step remain active because hazard evaluation short-circuits the step. |

## ADR-008 — Use Mulberry32 with active-list Bridson sampling

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Seed Mulberry32 with unsigned `Math.imul(levelIndex, 49297)` and generate target centers with grid-accelerated Bridson Poisson-disc sampling using 30 candidates per active point. Reserve a 110-unit radius around the fixed orb spawn. |
| Options considered | SplitMix32; Mulberry32; rejection-only dart throwing; Bridson active-list sampling; pre-authored layouts. |
| Rationale | Mulberry32 is compact and deterministic in JavaScript's 32-bit integer operations. Bridson sampling directly enforces the PRD 70-unit minimum and is deterministic when every random choice comes from the seeded stream. Reserving the spawn prevents an immediate target overlap without hand-editing seeds. |
| Consequences | Changing candidate order, attempt count, or random consumption changes every layout and launch velocity. The sampler throws rather than silently overlap if it cannot satisfy the requested count. |

## ADR-009 — Favor the Linear Orbits `6+` tier rule over the sample formula

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Set Tier 01-05 allowance to `max(6, pseudocodeFormula)` and cycle Level 05 victory back to Level 01 until Tier 06 is implemented. |
| Options considered | Use the pseudocode's 4-5 tethers; enforce the tier table's 6+ promise; add two to the formula; expose incomplete levels after 05; stop progression; cycle the implemented tier. |
| Rationale | The named progression table is the clearest player-facing difficulty contract and explicitly says `6+`. Cycling keeps the intermediate build runnable without pretending later mechanics exist. |
| Consequences | Tether allowance differs from the PRD sample pseudocode for Levels 01-05. The progression cycle is temporary and must be removed in the Centrifugal Cuts commit. |

## ADR-010 — Lazily create and resume one shared Web Audio context

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Expose one global assetless sound facade, create its `AudioContext` and master gain only from the first primary pointer gesture, and make every cue a short-lived node graph. |
| Options considered | Create context during page load; create one context per cue; lazy shared context; omit audio when direct-file launched. |
| Rationale | Mobile autoplay policies commonly suspend contexts created outside a gesture. A lazy shared context satisfies that requirement, avoids repeated context allocation, and still works when `index.html` is opened directly. |
| Consequences | No sound can occur before the first gesture. Web Audio creation/resume failures intentionally degrade to silence; gameplay remains unaffected. Random noise timbre is not seed-deterministic because it does not affect state. |

## ADR-011 — Keep feedback effects inside the fixed simulation clock

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Advance released-cord springs, target facets, recoil lifetime, and pulse phase from the same fixed-step elapsed time used by physics, including while the game is in a terminal state. |
| Options considered | CSS animations; render-delta effects; Web Animations; fixed-step Canvas effects. |
| Rationale | All visuals already live on Canvas, and fixed-step updates make the required `240ms`/`60ms` timing reproducible in diagnostics. Continuing effects after terminal entry lets the final target visibly shatter instead of freezing on victory. |
| Consequences | Effects can advance in six catch-up steps after a long frame. Recoil uses quadratic decay as a compact damp-back curve; facet speed/spin and the spring's 450ms safety lifetime are implementation choices beyond the PRD constants. |

## ADR-012 — Give moving targets deterministic escape and orbit paths

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Decision | Guarantee one moving target in Levels 06-12, seed motion on the others at 50%, use `[72, 90)` units/s, send linear paths generally through center until they fully escape, and keep circular paths on `12-20` unit radii. Detect orb contact in relative swept space. |
| Options considered | Move every target; preserve the pseudocode's independent 50% chance; guarantee one plus 50% for the rest; bounce linear targets; fail on partial boundary crossing; fail only after full-circle escape. |
| Rationale | Guaranteeing one makes the tier mechanic present in every level. An inward initial heading prevents unfair near-edge instant losses, while unbounded travel preserves the tier's explicit escape failure. Relative sweeps correctly account for both bodies moving within a fixed step. |
| Consequences | The pseudocode's ambiguous `speed: 1.5` is interpreted as a gameplay-scale `72-90` logical units/s range rather than literal units/s. Circular targets never normally escape. Progression now loops after Level 12 until Deflection lands. |
