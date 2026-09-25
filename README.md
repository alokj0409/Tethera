# TETHERA

TETHERA is a one-thumb kinetic-physics puzzle game about turning momentum into precise, satisfying arcs. Plant an anchor, hold to orbit, and release to send a luminous orb through a field of resonant targets, hazards, and increasingly strange spatial mechanics.

## Current status

**The production visual language is live; collision and outcomes are next.** The game now renders the complete flat geometric vocabulary and editorial HUD with every PRD color token, manually tracked system-monospace labels, logical grid marks, orbital guides, and a programmatic restart control.

## Run locally

Open `index.html` directly in a modern browser, or serve this directory with any static file server and open its root URL. The current scaffold displays the TETHERA logical playfield; gameplay is added in later checkpoints.

No package manager, dependency installation, bundler, or external asset download will be required.

## Controls

- Press or touch anywhere in the play area to plant an anchor and tether the orb.
- Hold to keep the tether active and orbit the anchor.
- Release to snap the tether and continue in free flight.
- Press the circular-arrow control at bottom right to restart the current level.
- Clear every target before the allotted tether count reaches zero.

The controls and orb motion are interactive. Targets and the displayed spike are visual-only until the next collision checkpoint, so the current build is still a physics playground rather than a complete level.

## Project structure

```text
Tethera/
|-- PRD.md         Canonical product requirements
|-- index.html     Full-viewport, safe-area-aware application shell
|-- game.js        Canvas sizing, logical scaling, and current game runtime
|-- README.md      Project overview, run instructions, and implementation status
|-- SPECS.md       Living technical specification of implemented behavior
|-- DECISIONS.md   Append-only architecture decision log
|-- RULES.md       Definitive gameplay rules and tier progression
|-- CHANGELOG.md   Per-commit project history
`-- TODO.md        Remaining requirements, known issues, and open judgments
```

The remaining planned runtime file is `audio.js`; it will be added with the procedural-audio checkpoint.

## Source of truth

[`PRD.md`](PRD.md) is authoritative for product requirements. `SPECS.md` and `RULES.md` describe what the checked-in code actually does and must be updated whenever implementation behavior changes. `DECISIONS.md` records choices the PRD leaves open.
