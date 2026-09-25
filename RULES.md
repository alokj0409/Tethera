# TETHERA Gameplay Rules

Last updated: 2026-09-25  
Implementation checkpoint: Spike Strata (Levels 21-35)

This file is the definitive rules reference for the checked-in game. The complete core loop and generated Levels 01-35 are active; wormholes and pulsars remain canonical requirements until their implementation checkpoints land.

## Objective

Guide the kinetic orb through every target core in the level. The player controls anchors, not the orb directly: plant a tether point, hold it to bend the orb's path into an orbit, then release to preserve the orb's current tangential flight.

## Input and tether accounting

1. Pressing or touching the play area plants one anchor at that logical coordinate and immediately tethers the orb.
2. Holding keeps the tether active and constrains the orb to circular or elliptical motion around the anchor.
3. Releasing snaps the tether and returns the orb to free flight at its current tangential velocity.
4. Planting an anchor consumes one tether from the level allowance.
5. A level is won when every target core is shattered.
6. The final tether remains usable while held. If it is released with targets still uncleared and no tether allowance remaining, the level enters `GAME_OVER`.
7. A level is also lost when the orb strikes a lethal hazard once hazard collision is implemented.
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

An anchor placed closer than `12` logical units to the orb is shifted to an effective `12`-unit radius. Its fallback radial direction is perpendicular to the incoming velocity so that the initial unit tangent aligns with that velocity. Free flight advances at constant velocity. No outer-boundary response exists yet, so an untethered orb can leave the logical field in this checkpoint.

## Contacts and entities

- **Target core:** swept circle-circle contact clears the target. The orb-center path for a physics step is tested against a circle whose radius is `orbRadius + targetRadius`. Clearing the final target wins the level.
- **Hazard spike:** lethal contact immediately fails the level. The rendered triangle is the collision polygon; the swept orb center is tested against the triangle interior and a capsule of `orbRadius` around each edge.
- **Bouncer:** a non-lethal line segment introduced at Level 13. Swept contact reflects velocity with `v' = (v - 2 * dot(v, n) * n) * 1.1`, separates the orb by `radius + 0.5`, and gives that segment an `80ms` contact cooldown. Impact while tethered snaps the tether and continues in `FREE_FLIGHT`; if it was the final tether, normal zero-tether failure follows.
- **Wormhole pair:** entering one gate exits through its paired gate while preserving `|v|`. Exit direction, offset, and re-entry cooldown are pending.
- **Pulsar field:** periodically applies gravity that warps the orb trajectory. Force falloff, pulse timing, duration, and stacking are pending.
- **Moving target:** from Level 06 onward, at least one target moves. Linear targets travel at a seeded `72-90` units/s generally through the canvas center and fail the level once their whole circle escapes the `390 x 844` field. Circular targets orbit a seeded center at the same tangential-speed range with a `12-20` unit radius. Orb contact is tested in relative swept space.

Pending wormhole and pulsar details above are not implemented gameplay and are tracked in `TODO.md`. When a spike hit and final-target contact are both possible in one fixed step, the spike loss takes precedence. The outer logical boundary currently has no orb collision response.

## Level tiers

| Levels | Tier | Unlock | Failure states |
| --- | --- | --- | --- |
| 01-05 | Linear Orbits | Static target cores; generous tether limits (`6+`) | Zero tethers while targets remain |
| 06-12 | Centrifugal Cuts | Targets moving along linear or circular paths | Escaped target; zero tethers while targets remain |
| 13-20 | Deflection | Non-lethal rubber barricades returning the orb at `1.1x` speed | Zero tethers while targets remain |
| 21-35 | Spike Strata | Lethal geometric triangle hazards | Hazard impact; zero tethers while targets remain |
| 36-50 | Wormhole Nodes | Paired gates preserving speed magnitude | Hazard impact; zero tethers while targets remain |
| 51+ | Pulsar Fields | Periodic gravity pulses | Hazard impact; zero tethers while targets remain |

Mechanics remain available after their introduction unless a generated level intentionally omits them. This progression interpretation will be validated when later tiers are implemented.

Levels 01-35 are currently generated. All contain `min(2 + floor(level / 4), 7)` targets with 14-unit radii and deterministic entity centers separated by at least 70 logical units and 110 units from the orb spawn. Levels 01-05 keep every target static and grant at least six tethers. Levels 06-12 add seeded linear/circular motion. Levels 13-20 retain moving targets and add one to three seeded bouncers. Levels 21-35 retain earlier mechanics and add `min(floor((level - 10) / 3), 6)` seeded 12-unit spikes.

## Progression

Victory advances to the next numerical level and failure resets the current stage. At the present implementation boundary, victory on Level 35 cycles to Level 01; this temporary loop will be removed when Tier 36 lands. Restarting or revisiting a level reproduces targets, paths, bouncers, spikes, and launch velocity exactly.
