# TETHERA Gameplay Rules

Last updated: 2026-09-25  
Implementation checkpoint: documentation baseline (rules are canonical but not yet playable)

This file is the definitive rules reference for the checked-in game. Until runtime code exists, it records the PRD rules that each implementation checkpoint must adopt; unresolved details are explicitly marked rather than invented.

## Objective

Guide the kinetic orb through every target core in the level. The player controls anchors, not the orb directly: plant a tether point, hold it to bend the orb's path into an orbit, then release to preserve the orb's current tangential flight.

## Input and tether accounting

1. Pressing or touching the play area plants one anchor at that logical coordinate and immediately tethers the orb.
2. Holding keeps the tether active and constrains the orb to circular or elliptical motion around the anchor.
3. Releasing snaps the tether and returns the orb to free flight at its current tangential velocity.
4. Planting an anchor consumes one tether from the level allowance.
5. A level is won when every target core is shattered.
6. A level is lost when the orb strikes a lethal hazard, or when no tethers remain while targets are still uncleared.

The exact moment at which zero remaining tethers triggers failure relative to an active final tether is not specified by the PRD and remains unresolved until the state-machine increment.

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

The orb's speed is never intentionally killed when an anchor is placed. The exponent is fixed at `0.65`. A minimum safe radius for an anchor placed at or extremely near the orb is not defined yet.

## Contacts and entities

- **Target core:** circle-circle contact with the orb shatters and clears the target. Clearing the final target wins the level.
- **Hazard spike:** lethal contact immediately fails the level. Geometry is triangular in the visual design; the precise collision representation is pending.
- **Bouncer:** a non-lethal line barricade that reflects the orb at `1.1x` return speed. The exact normal/reflection and anti-repeat-contact rules are pending.
- **Wormhole pair:** entering one gate exits through its paired gate while preserving `|v|`. Exit direction, offset, and re-entry cooldown are pending.
- **Pulsar field:** periodically applies gravity that warps the orb trajectory. Force falloff, pulse timing, duration, and stacking are pending.
- **Moving target:** follows either a linear or circular path. Path bounds, phase, and escape detection are pending.

Pending details above are not implemented gameplay and are tracked in `TODO.md` for later ADRs.

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

## Progression

Victory advances to the next numerical level. Failure resets the current stage. Levels must be deterministic for the same level index and logical play bounds.
