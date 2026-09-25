# TETHERA TODO

Last updated: 2026-09-25

This list tracks product requirements not present in the checked-in implementation. Items are ordered by the requested delivery sequence; completed work is removed from the active list and reflected in `CHANGELOG.md`.

## Next increment — Cross-viewport QA and final polish

- Exercise iPhone SE, standard 390x844, and tall 20:9 viewport sizes with DPR variation.
- Add adaptive collision sub-stepping for extreme whip speeds and verify delta/catch-up bounds.
- Profile the render/update loop, harden browser compatibility, and complete final documentation reconciliation.
- Update all living documents, commit this increment alone, and push `main`.

## Remaining build order

- Perform cross-viewport QA from iPhone SE dimensions through tall 20:9 Android dimensions.
- Add adaptive collision sub-stepping for extreme angular velocity and complete the final performance pass targeting steady 60fps.

## Known bugs

- No confirmed gameplay defects; cross-browser and cross-viewport QA remains pending.

## Open judgments

- Define free-flight orb behavior at the logical play boundary.
- Validate the interpretation that mechanics accumulate after their introduction tier; supersede or amend ADR-001 only if rendering constraints force a change.

## Decision cross-references

- ADR-001 selects one Canvas 2D surface for the game and HUD; accessibility mapping remains an implementation concern.
