# TETHERA

TETHERA is a one-thumb kinetic-physics puzzle game about turning momentum into precise, satisfying arcs. Plant an anchor, hold to orbit, and release to send a luminous orb through a field of resonant targets, hazards, and increasingly strange spatial mechanics.

## Current status

**Procedural audio is wired into the playable core; kinetic animation and impact juice are next.** `audio.js` lazily synthesizes snap, pentatonic chime, shatter, and failure cues after the first user gesture, with no downloaded audio or runtime dependency.

## Run locally

Open `index.html` directly in a modern browser, or serve this directory with any static file server and open its root URL. The current scaffold displays the TETHERA logical playfield; gameplay is added in later checkpoints.

No package manager, dependency installation, bundler, or external asset download will be required.

## Controls

- Press or touch anywhere in the play area to plant an anchor and tether the orb.
- Hold to keep the tether active and orbit the anchor.
- Release to snap the tether and continue in free flight.
- Press the circular-arrow control at bottom right to restart the current level.
- Clear every target before the allotted tether count reaches zero.

The controls, physics, target collection, victory, and reset loop are interactive across the five generated Linear Orbits levels. After Level 05, the current milestone cycles to Level 01 until later tier commits extend progression; spike collision remains implemented but no spikes are generated in this tier.

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

All three required runtime files are present; later checkpoints extend `game.js` without adding a build system or dependency layer.

## Source of truth

[`PRD.md`](PRD.md) is authoritative for product requirements. `SPECS.md` and `RULES.md` describe what the checked-in code actually does and must be updated whenever implementation behavior changes. `DECISIONS.md` records choices the PRD leaves open.
