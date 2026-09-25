# Changelog

All notable changes to TETHERA are documented here in Keep a Changelog style. Each repository commit receives its own dated entry.

## [Unreleased]

No unreleased changes.

## [2026-09-25] — Low-speed recovery

### Added

- Added a tether-costed recovery impulse when incoming orb speed falls below 48 logical units/s.
- Added in-play `RECOVERY IMPULSE` feedback while the assist is active.

### Changed

- Floored assisted tangential speed at 72 logical units/s without changing normal projection or whip results.

## [2026-09-25] — Restart recovery

### Fixed

- Fixed forced tether breaks recursively calling the snap helper until the animation loop stopped.
- Restored moving-orb simulation after restarting from boundary, bouncer, or wormhole failure paths.

## [2026-09-25] — Final QA and runtime hardening

### Added

- Added adaptive collision substeps for extreme orb speeds.
- Added elastic reflection at the visible logical play boundary.
- Added automated viewport/DPR coverage for iPhone SE, 390-wide, tall 20:9, and large Android layouts.

### Changed

- Limited each animation frame to six fixed catch-up steps and discarded excess paused-tab backlog.
- Centralized forced tether release for bouncer, wormhole, and boundary responses.
- Reconciled all living documentation with the completed implementation.

## [2026-09-25] — Pulsar Fields

### Added

- Added one to three deterministic periodic gravity poles from Level 51 onward.
- Added sine pulse envelopes, softened inverse-square attraction, per-pole acceleration caps, and additive force vectors.
- Added tangential force projection during held tethers and full-vector acceleration in free flight.
- Added flat programmatic pulsar rings and animated inward ticks.

### Changed

- Removed the milestone progression loop; deterministic levels now continue for every positive safe-integer index.

## [2026-09-25] — Wormhole Nodes

### Added

- Added deterministic oriented wormhole pairs for Levels 36-50.
- Added swept gate entry, paired exit placement, velocity rotation with exact speed preservation, and 250ms re-entry suppression.
- Added flat programmatic gate rings and orientation marks with no glow or gradient.
- Added tether snap-to-free-flight behavior on portal entry.
- Added a bounded deterministic dart-throw fallback when dense Poisson sampling exhausts its active frontier.

### Changed

- Extended deterministic generation and progression through Level 50.
- Moved the temporary milestone progression loop to Level 50.

## [2026-09-25] — Spike Strata

### Added

- Added deterministic 12-unit lethal triangle hazards for Levels 21-35.
- Added seeded spike rotations and shared Poisson-disc placement across targets, bouncers, and hazards.
- Activated existing swept polygon contact and failure audio in generated levels.

### Changed

- Extended deterministic generation and progression through Level 35.
- Moved the temporary milestone progression loop to Level 35.

## [2026-09-25] — Deflection

### Added

- Added one to three deterministic line bouncers across Levels 13-20.
- Added swept orb-line collision, normal-based reflection, contact separation, and 80ms repeat-hit suppression.
- Added tether snap-to-free-flight behavior on bouncer impact.

### Changed

- Extended deterministic generation and progression through Level 20.
- Moved the temporary milestone progression loop to Level 20.

## [2026-09-25] — Centrifugal Cuts

### Added

- Added deterministic linear and circular moving-target paths for Levels 06-12.
- Added relative swept collision between the moving orb and moving targets.
- Added target-escape failure after a linear target fully crosses the canvas boundary.

### Changed

- Extended deterministic generation and progression through Level 12.
- Moved the temporary milestone progression loop from Level 05 to Level 12.

## [2026-09-25] — Kinetic feedback

### Added

- Added released-cord retraction using the required `k = 320`, `d = 24` damped spring.
- Added four 45-degree target facets with 240ms movement, spin, and fade.
- Added 2.5-pixel impact recoil damped to zero over 60ms.
- Added a 1.0-2.2px tether pulse above 12 rad/s angular velocity.

## [2026-09-25] — Procedural audio

### Added

- Added lazy, dependency-free Web Audio synthesis for snap, pentatonic chime, shatter, and fail cues.
- Added a shared master gain and silent fallback when Web Audio is unavailable.
- Wired sound to tether release, target collection, victory, spike impact, and tether-limit failure.

## [2026-09-25] — Linear Orbits generation

### Added

- Added deterministic Mulberry32 level seeds derived from `levelIndex * 49297`.
- Added grid-accelerated Bridson Poisson-disc target placement with 70-unit separation and an orb-spawn exclusion radius.
- Added seeded launch direction/speed and deterministic diagnostic level snapshots.

### Changed

- Replaced fixed placeholder entities with generated static-target layouts for Levels 01-05.
- Enforced the Linear Orbits tier's minimum allowance of six tethers and temporarily looped Level 05 victory to Level 01.

## [2026-09-25] — Collision and outcomes

### Added

- Added swept circle contact for target collection across each physics step.
- Added swept orb-versus-triangle collision using the exact rendered hazard edges.
- Added active victory and game-over transitions with terminal physics freeze and tether cleanup.

### Changed

- Hazard impact now takes precedence over target collection in the same physics step.
- Target data now carries its explicit 14-unit collision radius.

## [2026-09-25] — Token-complete rendering

### Added

- Added programmatic flat rendering for the orb, anchor pin, tether, resonant targets, triangular spike, orbital track, and logical grid.
- Added an editorial HUD with level, target progress, tether allowance, and manually tracked system-monospace typography.
- Added geometric victory/failure panels and a programmatic circular-arrow restart control.

### Changed

- Replaced placeholder borders and debug-state labels with the final PRD color-token vocabulary.

## [2026-09-25] — Dynamic tether physics

### Added

- Added fixed-step free-flight and analytic tether-orbit motion.
- Added radial-vector normalization, signed unit-tangent projection, and the exact `0.65` short-radius whip multiplier.
- Added momentum-preserving tether release and prior-radius tracking between anchors.
- Added a 12-unit close-anchor guard and a diagnostic physics-step hook.

### Changed

- The orb now moves continuously in `AWAITING_INPUT`, `TETHERED`, and `FREE_FLIGHT` states.

## [2026-09-25] — Core state and input

### Added

- Added the five-state runtime contract with guarded state transitions.
- Added primary-pointer coordinate mapping, pointer capture, press-to-anchor, hold, and release-to-free-flight handling.
- Added placeholder targets, orb, tether, status, and HUD drawing so state changes are visible before physics is introduced.
- Added diagnostic state snapshots through `TetheraGame.getState()`.

### Changed

- Defined zero-tether failure to occur after the final active tether is released, preserving use of the final allowance.

## [2026-09-25] — Responsive canvas scaffold

### Added

- Added a build-step-free `index.html` application shell with viewport locking and safe-area integration.
- Added a DPR-calibrated Canvas 2D surface using the fixed `390 x 844` logical coordinate system and centered aspect-fit letterboxing.
- Added resize observation and viewport-resize handling so the logical surface remains sharp and centered across viewport changes.

## [2026-09-25] — Documentation baseline

### Added

- Added the canonical product requirements to the repository root.
- Added the project overview, future run instructions, controls, and status in `README.md`.
- Added living implementation, gameplay-rule, architecture-decision, and remaining-work documents.
- Recorded Canvas 2D as the rendering approach in ADR-001.
