# TETHERA TODO

Last updated: 2026-09-25

This list tracks product requirements not present in the checked-in implementation. Items are ordered by the requested delivery sequence; completed work is removed from the active list and reflected in `CHANGELOG.md`.

## Next increment — Collision and outcomes

- Add swept circle-circle target collection so fast motion cannot skip target cores.
- Add swept orb-versus-triangle spike contact and boundary-line response.
- Activate victory/failure transitions and deterministic reset/advance timing.
- Update all living documents, commit this increment alone, and push `main`.

## Remaining build order

- Implement deterministic seeded generation and Poisson-disc placement for Tier 01-05.
- Add `audio.js` Web Audio synthesis for snap, chime, shatter, and fail events.
- Add damped tether motion (`k = 320`, `d = 24`), four-facet `240ms` shatter particles, `2.5px`/`60ms` recoil, and high-angular-speed tether pulse.
- Implement Tier 06-12 moving targets in a dedicated checkpoint.
- Implement Tier 13-20 bouncers in a dedicated checkpoint.
- Implement Tier 21-35 spike hazards in a dedicated checkpoint.
- Implement Tier 36-50 paired wormholes in a dedicated checkpoint.
- Implement Tier 51+ pulsar fields in a dedicated checkpoint.
- Perform cross-viewport QA from iPhone SE dimensions through tall 20:9 Android dimensions.
- Add fixed-step `requestAnimationFrame` timing, delta clamping, collision robustness, and a final performance/polish pass targeting steady 60fps.

## Known bugs

- No confirmed defects in the canvas-only checkpoint; gameplay is intentionally not present yet.

## Open judgments

- Choose the deterministic PRNG and exact Poisson-disc variant, including fallback when the sampler cannot produce enough entities. Record the result in a future ADR.
- Define free-flight behavior at the logical play boundary and moving-target escape boundaries. Record the result in a future ADR.
- Define spike collision geometry and swept-contact handling.
- Define bouncer reflection normals, endpoint contacts, separation, and repeat-hit suppression.
- Define moving-target path lengths, phases, wrapping/reversal, and escape rules.
- Define wormhole exit orientation, positional offset, and re-entry cooldown.
- Define pulsar force formula, falloff, cadence, active duration, and stacking.
- Validate the interpretation that mechanics accumulate after their introduction tier; supersede or amend ADR-001 only if rendering constraints force a change.

## Decision cross-references

- ADR-001 selects one Canvas 2D surface for the game and HUD; accessibility mapping remains an implementation concern.
