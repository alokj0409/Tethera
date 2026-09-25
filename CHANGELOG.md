# Changelog

All notable changes to TETHERA are documented here in Keep a Changelog style. Each repository commit receives its own dated entry.

## [Unreleased]

No unreleased changes.

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
