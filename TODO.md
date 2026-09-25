# TETHERA TODO

Last updated: 2026-09-25

This list tracks product requirements not present in the checked-in implementation. Items are ordered by the requested delivery sequence; completed work is removed from the active list and reflected in `CHANGELOG.md`.

## Remaining PRD work

- None. All required delivery, gameplay, presentation, tier, and runtime increments are implemented.

## Recommended manual validation

- Perform a final touch, audio, and visual smoke test on physical iOS and Android devices. The automated harness verified logical scaling, DPR backing dimensions, pointer mapping, deterministic Levels 01-120, high-speed reflection, stall clamping, and update/render throughput; its security policy prevented direct local-file browser navigation.

## Known bugs

- No confirmed gameplay defects.

## Open judgments

- None currently open. Boundary reflection is recorded in ADR-018, and cumulative tier mechanics are now implemented.

## Resolved judgments

- ADR-019 records the user-requested anti-stall recovery floor and its intentional extension of the canonical tether formula.

## Decision cross-references

- ADR-001 selects one Canvas 2D surface for the game and HUD; accessibility mapping remains an implementation concern.
- ADR-018 records boundary reflection, adaptive collision passes, and bounded catch-up work.
- ADR-019 records low-speed recovery thresholds, direction handling, and the tether-cost tradeoff.
