# TETHERA Living Technical Specification

Last updated: 2026-09-25  
Implementation checkpoint: documentation baseline (no runtime code)

This file describes the repository as implemented, not merely intended. At this checkpoint there is no playable application, physics loop, rendering layer, level generator, or sound system. The tables below preserve the canonical PRD baseline against which future commits will report their implemented values and deviations.

## Runtime and delivery

| Area | Current implementation |
| --- | --- |
| Application files | Not implemented; `index.html`, `game.js`, and `audio.js` are pending. |
| Build step | None planned or permitted. |
| Runtime dependencies | None planned or permitted. |
| Assets | No external image, audio, or font assets planned or permitted. |
| Rendering | Canvas 2D selected in ADR-001; not implemented. |
| Browser launch | Direct-file and static-server execution are required but not yet available. |

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
| `color-bg` | `#111215` | Not implemented |
| `color-canvas-subtle` | `#1A1C21` | Not implemented |
| `color-orb` | `#F4F2EC` | Not implemented |
| `color-tether` | `#E87A5D` | Not implemented |
| `color-target-idle` | `#2D3139` | Not implemented |
| `color-target-active` | `#F0C05A` | Not implemented |
| `color-hazard` | `#D94E41` | Not implemented |
| `color-ui-text` | `#8E929C` | Not implemented |

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

## Canonical state-machine baseline

No state machine is implemented. The required runtime states are:

```text
AWAITING_INPUT -> TETHERED -> FREE_FLIGHT
       ^              |
       +--------------+

Gameplay checks may transition to VICTORY or GAME_OVER.
VICTORY advances to the next level; GAME_OVER restarts the current level.
```

Required runtime data includes the current state and level, tethers remaining, score streak, orb position/velocity/radius, active anchor, targets, and particles.

## Canonical scaling baseline

Viewport handling is not implemented. The required model is a fixed `390 x 844` logical coordinate system, uniformly aspect-fit with `min(viewportWidth / 390, viewportHeight / 844)`, centered within a full-viewport `#111215` bleed. The canvas must be calibrated to `window.devicePixelRatio`, and page layout must respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` with a `16px` minimum.

## Deviations from PRD

None. No product behavior has been implemented yet.
