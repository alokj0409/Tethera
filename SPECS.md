# TETHERA Living Technical Specification

Last updated: 2026-09-25  
Implementation checkpoint: collision and outcomes

This file describes the repository as implemented, not merely intended. The app currently provides the responsive renderer, state/input loop, dynamic motion, swept target/spike collision, and win/loss flow. Level generation and sound remain pending.

## Runtime and delivery

| Area | Current implementation |
| --- | --- |
| Application files | `index.html` and `game.js` implement the canvas shell; `audio.js` is pending. |
| Build step | None planned or permitted. |
| Runtime dependencies | None planned or permitted. |
| Assets | No external image, audio, or font assets planned or permitted. |
| Rendering | One Canvas 2D surface, selected in ADR-001. The current pass draws the background, logical boundary, and scaffold label. |
| Browser launch | Runs by opening `index.html` directly or through a static server. |

## Physics implementation

Anchor engagement implements the PRD Section 3.2 formulas directly:

- Radial vector: `r = p_orb - p_anchor`.
- Unit tangent: `t_hat = (-r_y / |r|, r_x / |r|)`.
- Tangential projection: `v_tangent = v dot t_hat`.
- Short-tether whip: when `|r_new| < |r_old|`, `v_tangent' = v_tangent * (|r_old| / |r_new|)^0.65`.
- When the new radius is shorter than the most recently released tether, the projected speed is multiplied by `(oldRadius / newRadius)^0.65`.

The simulation advances in fixed `1/60s` steps. Free flight uses constant-velocity Euler position updates. While tethered, the runtime stores radius, polar angle, and signed tangential speed; each step advances `angle += (tangentialSpeed / radius) * dt` and reconstructs exact circular position and tangent velocity. Releasing preserves that current tangent velocity. Frame time is clamped to `0.1s` before catch-up stepping.

Anchors closer than `12` logical units are moved onto a `12`-unit effective radius along a radial direction chosen so its unit tangent aligns with the incoming velocity. This prevents zero-length normalization and unbounded radius ratios while retaining the tap's intended rotation direction (ADR-005). There is no free-flight boundary response yet. Bouncer physics remains unimplemented; its required return-speed multiplier is `1.1x`.

## Collision and outcome handling

Each physics step retains the orb's starting and ending center. Target contact computes the squared minimum distance from the target center to that swept segment and compares it with `(orbRadius + targetRadius)^2`. Every intersected active target is cleared in the same step and increments `scoreStreak`.

Spike hazards are triangles whose three vertices exactly match the rendered geometry. Contact succeeds if either swept endpoint is inside the triangle or if the swept center segment comes within one orb radius of any triangle edge. Segment intersection and endpoint-to-segment distances provide the edge-capsule test. A spike hit enters `GAME_OVER`; clearing the final target enters `VICTORY`. If both could occur during one fixed step, the hazard is resolved first (ADR-007).

Terminal transitions clear any active anchor and tether and freeze physics. A new press resets the current failed level or advances after victory. Outer boundaries and bouncer collision are still unimplemented.

## Canonical design-token baseline

No token is used in code yet. Required values for the rendering increment are:

| Token | Required value | Implemented use |
| --- | --- | --- |
| `color-bg` | `#111215` | Page bleed and canvas clear color |
| `color-canvas-subtle` | `#1A1C21` | Logical playfield scaffold border |
| `color-orb` | `#F4F2EC` | Solid kinetic orb fill |
| `color-tether` | `#E87A5D` | Tether line and anchor pin |
| `color-target-idle` | `#2D3139` | Concentric target rings |
| `color-target-active` | `#F0C05A` | Resonant target core and victory heading |
| `color-hazard` | `#D94E41` | Geometric spike and failure heading |
| `color-ui-text` | `#8E929C` | HUD, prompt, and restart icon |

Typography uses a system monospace fallback at `11px` to `13px`, uppercase, with `0.12em` tracking applied by explicitly positioning each glyph on Canvas. No font asset is present. All entities, grid marks, HUD elements, and overlays use flat fills or one-pixel strokes; there are no gradients, shadows, blurs, or glow effects.

The HUD shows zero-padded level number, cleared/total target count, and remaining tethers. A bottom-right circular-arrow icon resets the current level through a circular logical-space hit target centered at `(350, 794)` with radius `18`.

## Canonical level-generation baseline

Level generation is not implemented. PRD Section 4 requires:

- Seed input: `levelIndex * 49297`, fed to a deterministic PRNG such as Mulberry32 or SplitMix32.
- Logical placement padding: `60` units horizontally and a `100`-unit header offset.
- Play height: logical height minus `180` units.
- Target count: `min(2 + floor(levelIndex / 4), 7)`.
- Hazard count: `levelIndex > 10 ? min(floor((levelIndex - 10) / 3), 6) : 0`.
- Tether allowance: `max(3, targetCount + 2 - floor(levelIndex / 25))`.
- Poisson-disc minimum separation: `70` logical units.
- Target radius: `14`; hazard radius: `12`.

The first generator increment is limited to Levels 01-05 and must not enable mechanics from later tiers.

## State machine and input

The five canonical states are implemented with an explicit allowed-transition table:

```text
AWAITING_INPUT -> TETHERED -> FREE_FLIGHT
       ^              |
       +--------------+

Pressing in `AWAITING_INPUT` or `FREE_FLIGHT` with at least one tether creates an anchor, decrements the allowance, captures the primary pointer, and enters `TETHERED`. Releasing or cancelling the captured pointer clears the anchor and enters `FREE_FLIGHT`. If that release leaves active targets and no tether allowance, it immediately continues to `GAME_OVER`. Pressing on `GAME_OVER` resets the current level; pressing on `VICTORY` advances one level.
```

Runtime data includes current state and level, tethers remaining, score streak, orb position/velocity/radius, active anchor, captured pointer ID, active tether dynamics, prior tether radius, targets, and particles. Pointer coordinates are transformed from the displayed canvas rectangle into the fixed logical coordinate system. A read-only snapshot and explicit physics-step hook are available through `TetheraGame` for diagnostics.

## Canonical scaling baseline

The runtime uses a fixed `390 x 844` logical coordinate system. It measures the safe content stage, computes `min(availableWidth / 390, availableHeight / 844)`, and centers the resulting CSS-sized canvas. Its backing-store dimensions equal the displayed dimensions multiplied by the uncapped `window.devicePixelRatio`; drawing transforms logical units by `scale * devicePixelRatio`. A `ResizeObserver`, window resize listener, and `visualViewport` resize listener keep metrics current. The page bleeds `#111215` across the viewport and applies top/bottom safe-area padding with a `16px` minimum plus native left/right safe-area insets.

## Deviations from PRD

None. Safe-area padding is applied outside the logical game surface, so the aspect-fit calculation uses only unobstructed content space.
