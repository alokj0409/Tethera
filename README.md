# TETHERA

TETHERA is a one-thumb kinetic-physics puzzle game about turning momentum into precise, satisfying arcs. Plant an anchor, hold to orbit, and release to send a luminous orb through a field of resonant targets, hazards, and increasingly strange spatial mechanics.

## Current status

**Documentation baseline complete; the playable canvas scaffold is the next increment.** The repository currently contains the canonical product requirements and the living project documentation, but no executable game files yet.

## Run locally

There is no runnable build in this initial documentation checkpoint. Once the canvas scaffold lands, the game will be build-step-free and will run either by opening `index.html` directly or by serving this directory with any static file server.

No package manager, dependency installation, bundler, or external asset download will be required.

## Controls

- Press or touch anywhere in the play area to plant an anchor and tether the orb.
- Hold to keep the tether active and orbit the anchor.
- Release to snap the tether and continue in free flight.
- Clear every target before the allotted tether count reaches zero.

These controls describe the canonical game design; they are not interactive until the corresponding implementation increments are complete.

## Project structure

```text
Tethera/
|-- PRD.md         Canonical product requirements
|-- README.md      Project overview, run instructions, and implementation status
|-- SPECS.md       Living technical specification of implemented behavior
|-- DECISIONS.md   Append-only architecture decision log
|-- RULES.md       Definitive gameplay rules and tier progression
|-- CHANGELOG.md   Per-commit project history
`-- TODO.md        Remaining requirements, known issues, and open judgments
```

The planned runtime files are `index.html`, `game.js`, and `audio.js`. They will be added in independently runnable checkpoints.

## Source of truth

[`PRD.md`](PRD.md) is authoritative for product requirements. `SPECS.md` and `RULES.md` describe what the checked-in code actually does and must be updated whenever implementation behavior changes. `DECISIONS.md` records choices the PRD leaves open.
