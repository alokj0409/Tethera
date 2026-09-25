# TETHERA Living Technical Specification

Last updated: 2026-09-25  
Implementation checkpoint: core state machine and pointer input

This file describes the repository as implemented, not merely intended. The app currently provides a responsive Canvas 2D shell, runtime state contract, tether accounting, and one-pointer input. Orb physics, collision, level generation, and sound remain pending.

## Runtime and delivery

| Area | Current implementation |
| --- | --- |
| Application files | `index.html` and `game.js` implement the canvas shell; `audio.js` is pending. |
| Build step | None planned or permitted. |
| Runtime dependencies | None planned or permitted. |
| Assets | No external image, audio, or font assets planned or permitted. |
| Rendering | One Canvas 2D surface, selected in ADR-001. The current pass draws the background, logical boundary, and scaffold label. |
| Browser launch | Runs by opening `index.html` directly or through a static server. |

## Canonical physics baseline

The following formulas are required by PRD Section 3.2 but are **not yet implemented**:

- Radial vector: `r = p_orb - p_anchor`.
- Unit tangent: `t_hat = (-r_y / |r|, r_x / |r|)`.
- Tangential projection: `v_tangent = v dot t_hat`.
- Short-tether whip: when `|r_new| < |r_old|`, `v_tangent' = v_tangent * (|r_old| / |r_new|)^0.65`.
- Bouncer return-speed multiplier: `1.1x` (collision response details remain unresolved).

No numerical integration method, close-anchor radius floor, free-flight boundary behavior, or collision sub-stepping policy has been implemented. Those gaps are tracked in `TODO.md` and will be recorded in `DECISIONS.md` when resolved.

## Canonical design-token baseline

No token is used in code yet. Required values for the rendering increment are:

| Token | Required value | Implemented use |
| --- | --- | --- |
| `color-bg` | `#111215` | Page bleed and canvas clear color |
| `color-canvas-subtle` | `#1A1C21` | Logical playfield scaffold border |
| `color-orb` | `#F4F2EC` | Not implemented |
| `color-tether` | `#E87A5D` | Not implemented |
| `color-target-idle` | `#2D3139` | Not implemented |
| `color-target-active` | `#F0C05A` | Not implemented |
| `color-hazard` | `#D94E41` | Not implemented |
| `color-ui-text` | `#8E929C` | Scaffold label |

Typography must use a system monospace fallback at `11px` to `14px`, uppercase, with `0.12em` tracking. No font asset is present.

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

Runtime data includes current state and level, tethers remaining, score streak, orb position/velocity/radius, active anchor, captured pointer ID, targets, and particles. Pointer coordinates are transformed from the displayed canvas rectangle into the fixed logical coordinate system. A read-only snapshot is available through `TetheraGame.getState()` for diagnostics.

## Canonical scaling baseline

The runtime uses a fixed `390 x 844` logical coordinate system. It measures the safe content stage, computes `min(availableWidth / 390, availableHeight / 844)`, and centers the resulting CSS-sized canvas. Its backing-store dimensions equal the displayed dimensions multiplied by the uncapped `window.devicePixelRatio`; drawing transforms logical units by `scale * devicePixelRatio`. A `ResizeObserver`, window resize listener, and `visualViewport` resize listener keep metrics current. The page bleeds `#111215` across the viewport and applies top/bottom safe-area padding with a `16px` minimum plus native left/right safe-area insets.

## Deviations from PRD

None. Safe-area padding is applied outside the logical game surface, so the aspect-fit calculation uses only unobstructed content space.
