# TETHERA TODO

Last updated: 2026-09-25

This list tracks product requirements not present in the checked-in implementation. Items are ordered by the requested delivery sequence; completed work is removed from the active list and reflected in `CHANGELOG.md`.

## Next increment — Tier 36-50: Wormhole Nodes

- Generate deterministic paired spatial gates for Levels 36-50.
- Define exit orientation, positional offset, velocity rotation, and re-entry cooldown while preserving speed magnitude.
- Move the temporary progression loop to Level 50.
- Update all living documents, commit this increment alone, and push `main`.

## Remaining build order

- Implement Tier 51+ pulsar fields in a dedicated checkpoint.
- Perform cross-viewport QA from iPhone SE dimensions through tall 20:9 Android dimensions.
- Add fixed-step `requestAnimationFrame` timing, delta clamping, collision robustness, and a final performance/polish pass targeting steady 60fps.

## Known bugs

- No confirmed gameplay defects; cross-browser and cross-viewport QA remains pending.

## Open judgments

- Define free-flight orb behavior at the logical play boundary.
- Define wormhole exit orientation, positional offset, and re-entry cooldown.
- Define pulsar force formula, falloff, cadence, active duration, and stacking.
- Validate the interpretation that mechanics accumulate after their introduction tier; supersede or amend ADR-001 only if rendering constraints force a change.

## Decision cross-references

- ADR-001 selects one Canvas 2D surface for the game and HUD; accessibility mapping remains an implementation concern.
