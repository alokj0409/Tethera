# TETHERA

TETHERA is a one-thumb kinetic-physics puzzle game about turning momentum into precise, satisfying arcs. Plant an anchor, hold to orbit, and release to send a luminous orb through a field of resonant targets, hazards, and increasingly strange spatial mechanics.

## Current status

**Complete: every PRD progression tier, presentation system, audio cue, and final runtime hardening pass is implemented.** Low-speed recovery now makes stalled runs playable without changing normal whip physics; restart reliably restores the deterministic launch after every failure path.

## Run locally

Open `index.html` directly in a modern browser, or serve this directory with any static file server and open its root URL.

No package manager, dependency installation, bundler, or external asset download is required.

## Controls

- Press or touch anywhere in the play area to plant an anchor and tether the orb.
- Hold to keep the tether active and orbit the anchor.
- Release to snap the tether and continue in free flight.
- If the orb becomes very slow, plant one new anchor to trigger a visible recovery impulse.
- Press the circular-arrow control at bottom right to restart the current level.
- Clear every gold target before the allotted tether count reaches zero. Shorter anchors create faster whip turns.
- Avoid red spikes. Gray bouncers reflect and accelerate the orb; paired rings teleport it; pulsars bend its flight during their active beat.

The controls and full core loop are interactive across Linear Orbits (01-05), Centrifugal Cuts (06-12), Deflection (13-20), Spike Strata (21-35), Wormhole Nodes (36-50), and unbounded Pulsar Fields (51+).

## Project structure

```text
Tethera/
|-- PRD.md         Canonical product requirements
|-- index.html     Full-viewport, safe-area-aware application shell
|-- game.js        Canvas sizing, logical scaling, and current game runtime
|-- audio.js       Lazy, assetless Web Audio synthesis for gameplay cues
|-- README.md      Project overview, run instructions, and implementation status
|-- SPECS.md       Living technical specification of implemented behavior
|-- DECISIONS.md   Append-only architecture decision log
|-- RULES.md       Definitive gameplay rules and tier progression
|-- CHANGELOG.md   Per-commit project history
`-- TODO.md        Remaining requirements, known issues, and open judgments
```

All three required runtime files are present, with no build system or dependency layer.

## Source of truth

[`PRD.md`](PRD.md) is authoritative for product requirements. `SPECS.md` and `RULES.md` describe what the checked-in code actually does and must be updated whenever implementation behavior changes. `DECISIONS.md` records choices the PRD leaves open.
