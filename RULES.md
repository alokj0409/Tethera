# TETHERA Gameplay Rules

Last updated: 2026-09-25  
Implementation checkpoint: Final QA and runtime hardening

This file is the definitive rules reference for the checked-in game. The complete core loop and every progression tier are active, with deterministic levels continuing for all positive safe-integer indices.

## Objective

Guide the kinetic orb through every target core in the level. The player controls anchors, not the orb directly: plant a tether point, hold it to bend the orb's path into an orbit, then release to preserve the orb's current tangential flight.

## Input and tether accounting

1. Pressing or touching the play area plants one anchor at that logical coordinate and immediately tethers the orb.
2. Holding keeps the tether active and constrains the orb to circular or elliptical motion around the anchor.
3. Releasing snaps the tether and returns the orb to free flight at its current tangential velocity.
4. Planting an anchor consumes one tether from the level allowance.
5. A level is won when every target core is shattered.
6. The final tether remains usable while held. If it is released with targets still uncleared and no tether allowance remaining, the level enters `GAME_OVER`.
7. A level is also lost when the orb strikes a lethal hazard or a moving target fully escapes the field.
8. Pressing the circular-arrow control at the bottom right immediately resets the current level from any state.

The final-tether timing is defined by ADR-003. Pressing after `GAME_OVER` resets the current level; pressing after `VICTORY` advances to the next level.

## Orb and tether physics

For orb position `p_orb`, anchor position `p_anchor`, and orb velocity `v = (v_x, v_y)`:

```text
r = p_orb - p_anchor
t_hat = (-r_y / |r|, r_x / |r|)
v_tangent = v dot t_hat
```

When a newly planted anchor produces a shorter radius than the previous radius, apply the controlled whip scalar:

```text
v_tangent' = v_tangent * (|r_old| / |r_new|)^0.65
```

The signed tangential projection becomes the orb's tethered speed. If the new radius is shorter than the last released tether radius, it is multiplied by the exact `0.65` power scalar above. Longer or first tethers receive no scalar. A held tether advances around a constant radius using `angularVelocity = tangentialSpeed / radius`; release retains the current tangent velocity.

An anchor placed closer than `12` logical units to the orb is shifted to an effective `12`-unit radius. Its fallback radial direction is perpendicular to the incoming velocity so that the initial unit tangent aligns with that velocity. Free flight advances at constant velocity until another force or contact changes it. The orb reflects elastically from the rectangular play boundary spanning `(24, 84)` through `(366, 780)`; this preserves speed magnitude. A boundary hit while tethered snaps the tether and continues in free flight, with the normal final-tether loss rule still applying.

## Contacts and entities

- **Target core:** swept circle-circle contact clears the target. The orb-center path for a physics step is tested against a circle whose radius is `orbRadius + targetRadius`. Clearing the final target wins the level.
- **Hazard spike:** lethal contact immediately fails the level. The rendered triangle is the collision polygon; the swept orb center is tested against the triangle interior and a capsule of `orbRadius` around each edge.
- **Bouncer:** a non-lethal line segment introduced at Level 13. Swept contact reflects velocity with `v' = (v - 2 * dot(v, n) * n) * 1.1`, separates the orb by `radius + 0.5`, and gives that segment an `80ms` contact cooldown. Impact while tethered snaps the tether and continues in `FREE_FLIGHT`; if it was the final tether, normal zero-tether failure follows.
- **Wormhole pair:** swept entry within an 18-unit gate radius teleports to its pair. Velocity rotates by the destination orientation minus source orientation plus `pi`, preserving `|v|` exactly. The exit sits `29` logical units from the destination center along the new velocity and both directions are disabled for `250ms`. Entry while tethered snaps to `FREE_FLIGHT`; final-tether failure still applies.
- **Pulsar field:** one pole appears at Levels 51-65, two at 66-80, and three from 81 onward. Each emits a seeded `2.2-2.8s` pulse with a `0.55s` sine envelope. Attraction is `min(260, strength / (distance^2 + 36^2)) * envelope`, with seeded strength `160000-200000`; pole vectors add. Free flight receives full acceleration, while a held tether receives the tangential component only.
- **Moving target:** from Level 06 onward, at least one target moves. Linear targets travel at a seeded `72-90` units/s generally through the canvas center and fail the level once their whole circle escapes the `390 x 844` field. Circular targets orbit a seeded center at the same tangential-speed range with a `12-20` unit radius. Orb contact is tested in relative swept space.

Logical-boundary reflection is resolved after integration and before entity contacts. Entity collision order within a substep is spike, bouncer, wormhole, then target; a lethal spike therefore takes precedence. Pulsar acceleration is applied before orb position integration. A `1/60s` simulation step is subdivided when necessary so estimated travel is at most six logical units per collision pass, up to eight substeps.

## Level tiers

| Levels | Tier | Unlock | Failure states |
| --- | --- | --- | --- |
| 01-05 | Linear Orbits | Static target cores; generous tether limits (`6+`) | Zero tethers while targets remain |
| 06-12 | Centrifugal Cuts | Targets moving along linear or circular paths | Escaped target; zero tethers while targets remain |
| 13-20 | Deflection | Non-lethal rubber barricades returning the orb at `1.1x` speed | Zero tethers while targets remain |
| 21-35 | Spike Strata | Lethal geometric triangle hazards | Hazard impact; zero tethers while targets remain |
| 36-50 | Wormhole Nodes | Paired gates preserving speed magnitude | Hazard impact; zero tethers while targets remain |
| 51+ | Pulsar Fields | Periodic gravity pulses | Hazard impact; zero tethers while targets remain |

Mechanics remain available after their introduction unless a generated level intentionally omits them.

Every positive safe-integer level is generated. All contain `min(2 + floor(level / 4), 7)` targets with 14-unit radii and deterministic entity centers separated by at least 70 logical units and 110 units from the orb spawn. Levels 01-05 keep targets static and grant at least six tethers; Levels 06-12 add moving targets; Levels 13-20 add bouncers; Levels 21-35 add spikes; Levels 36-50 add gates; Levels 51+ retain prior mechanics and add one to three pulsars.

## Progression

Victory advances to the next numerical level and failure resets the current stage. Restarting or revisiting a level reproduces all entity layouts, orientations, phases, paths, pulse parameters, and launch velocity exactly.
