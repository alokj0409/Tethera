# TETHERA TODO

Last updated: 2026-09-25

This list tracks product requirements not present in the checked-in implementation. Items are ordered by the requested delivery sequence; completed work is removed from the active list and reflected in `CHANGELOG.md`.

## Next increment — Canvas scaffold

- Add `index.html` with viewport locking, `viewport-fit=cover`, a zero-margin full-viewport host, and safe-area padding.
- Add `game.js` with a `390 x 844` logical canvas, DPR-calibrated backing store, uniform aspect-fit scaling, centered letterboxing, and full-viewport background bleed.
- Verify direct-file execution and static-server execution with no dependencies or build step.
- Update all living documents, commit this increment alone, and push `main`.

## Remaining build order

- Implement the five-state core state machine and pointer input with placeholder rendering.
- Implement tether dynamics: radial vector, tangent projection, momentum preservation, and `0.65` short-radius whip scaling.
- Implement token-driven drawing for the orb, anchor, tether, target, hazard, and HUD.
- Implement target circle collision, hazard/bouncer line contact, and victory/failure transitions.
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

- No runnable application exists in this documentation-only checkpoint.

## Open judgments

- Define fixed simulation step, frame-delta clamp, maximum catch-up steps, and collision sub-stepping. Record the result in a future ADR.
- Define the safe minimum tether radius and behavior for an anchor placed directly on the orb. Record the result in a future ADR.
- Resolve whether failure at zero tethers occurs immediately on planting the last anchor, on releasing it, or only after its opportunity can no longer clear targets. Record the result in a future ADR.
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
