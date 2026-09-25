# Product Requirements Document (PRD): *TETHERA*

---

## 1. Executive Summary & Concept

*TETHERA* is a minimal, kinetic-physics puzzle game designed for one-thumb mobile play.

```
   [Anchor Pin] ───────── (Elastic Cord)
         \ 
          \  <- Whipping velocity
           O [Kinetic Orb]  --->  (( Target Bell ))

```

### The Core Hook

A luminous kinetic orb swings freely in 2D space. Players do not steer the orb directly; instead, **tapping anywhere on screen plants a dynamic anchor pin**. The orb instantly tethers to that pin, shifting its orbital radius while preserving momentum. Shortening the tether whips the orb into high-speed arcs; extending it produces wide, slow sweeps.

### Primary Goals

* **Zero Cognitive Barrier:** Learnable in 3 seconds (Tap to tether, release to fly free).
* **Deep Kinetic Juice:** High tactile satisfaction derived from orbital acceleration, crisp acoustic resonance, and clean geometry.
* **Non-Repetitive Procedural Levels:** Seed-based level generation with changing constraints, environmental modifiers, and distinct physical hazards.
* **Human-Designed Editorial Aesthetic:** High-contrast graphic minimalism. Strictly **no glassmorphism**, no generic neon glows, and no skeumorphic clutter.

---

## 2. Visual Identity & Aesthetic System

The visual design is inspired by Swiss editorial layouts and mid-century graphic design: flat planes, stark contrast, precise line-weights, and disciplined motion.

```
+-------------------------------------------------------------+
|                      [ LEVEL 047 ]                          |
|                      Targets: 3/5                           |
|                                                             |
|                 ( ) [Spike Hazard]                          |
|                                                             |
|                          • [Active Anchor]                  |
|                         /                                   |
|                        / (0.75px crisp line)                |
|                       /                                     |
|                      O [Kinetic Orb]                        |
|                                                             |
|                                     (( * )) [Target Core]   |
|                                                             |
|  [Tethers Left: 4]                     [Restart Icon]       |
+-------------------------------------------------------------+

```

### Design Rules

* **No Glassmorphism:** No background blurs, no frosted-glass overlays, no pseudo-3D drop shadows.
* **Flat Geometric Planes:** Solid flat fills with crisp micro-borders ($1\text{px}$ maximum).
* **Assetless Vector Rendering:** All entities are drawn programmatically via 2D Canvas or SVG paths to guarantee infinite resolution scaling across all phone viewports.

### Design Tokens

| Token Name | Hex Value | Purpose |
| --- | --- | --- |
| `color-bg` | `#111215` | Canvas background (matte deep charcoal) |
| `color-canvas-subtle` | `#1A1C21` | Grid intersections, orbital track previews |
| `color-orb` | `#F4F2EC` | Player kinetic core (warm bone white) |
| `color-tether` | `#E87A5D` | Active tension line (warm terracotta) |
| `color-target-idle` | `#2D3139` | Uncollected targets |
| `color-target-active` | `#F0C05A` | Resonant targets (amber gold) |
| `color-hazard` | `#D94E41` | Spikes, dampeners, void walls (international vermilion) |
| `color-ui-text` | `#8E929C` | Level indicators, remaining anchor counters |

### Typography

* **Primary / Monospace:** `JetBrains Mono`, `SF Mono`, or system `monospace` ($11\text{px}$ to $14\text{px}$, uppercase, tracked out $+0.12\text{em}$).

---

## 3. Physics & Gameplay Mechanics

### 3.1 Input Mapping

* **Touch Down (`touchstart` / `pointerdown`):** Instantly spawns an anchor at touch coordinates $(x_a, y_a)$. A tension line forms between the anchor and the moving orb at $(x_o, y_o)$.
* **Touch Hold:** The tether remains rigid; the orb enters circular/elliptical motion centered on the anchor.
* **Touch Release (`touchend` / `pointerup`):** The tether snaps. The orb continues along its current tangential velocity vector.

### 3.2 Dynamic Tether Physics

When a new anchor is placed, do **not** kill the orb's speed. Angular momentum must convert dynamically:

1. **Radial Vector:** $\vec{r} = \vec{p}_{\text{orb}} - \vec{p}_{\text{anchor}}$
2. **Current Velocity:** $\vec{v} = (v_x, v_y)$
3. **Unit Tangent:** $\hat{t} = \left(-\frac{r_y}{\vert{}\vec{r}\vert{}}, \frac{r_x}{\vert{}\vec{r}\vert{}}\right)$
4. **Tangential Projection:** $v_{\text{tangent}} = \vec{v} \cdot \hat{t}$
5. **Whip Acceleration:** When $\vert{}\vec{r}_{\text{new}}\vert{} < \vert{}\vec{r}_{\text{old}}\vert{}$, apply a controlled conservation scalar:

$$v_{\text{tangent}}' = v_{\text{tangent}} \times \left(\frac{\vert{}\vec{r}_{\text{old}}\vert{}}{\vert{}\vec{r}_{\text{new}}\vert{}}\right)^{0.65}$$

*(Use a fractional exponent of $0.65$ to prevent infinity bugs during ultra-close finger drops).*

### 3.3 Win & Loss Conditions

* **Win:** Shatter all Target Cores within the allotted tether count.
* **Loss:** Orb collides with a Hazard Spike, or tether count drops to zero while targets remain.

---

## 4. Procedural Generation & Progression Matrix

Levels are seed-deterministic: `LevelSeed = Hash(LevelIndex)`. Each stage introduces varying arrangements and mechanics to eliminate repetition.

| Level Tier | Name | New Mechanics Introduced | Failure States |
| --- | --- | --- | --- |
| **01 – 05** | *Linear Orbits* | Fixed static target cores, generous tether limits ($6+$). | Zero tethers remaining. |
| **06 – 12** | *Centrifugal Cuts* | Kinetic targets that move in linear or circular paths. | Targets escape outer boundary. |
| **13 – 20** | *Deflection* | Non-lethal rubber barricades that bounce the orb at $1.1\times$ return velocity. | Zero tethers remaining. |
| **21 – 35** | *Spike Strata* | Lethal geometric triangles. Grazing them resets the stage. | Hazard impact. |
| **36 – 50** | *Wormhole Nodes* | Paired spatial gates: entering Gate A exits Gate B preserving $\vert{}\vec{v}\vert{}$. | Hazard impact. |
| **51+** | *Pulsar Fields* | Periodic gravity pulses that temporarily warp orbital trajectories. | Hazard impact / Zero tethers. |

### Level Generation Algorithm

```typescript
interface LevelConfig {
  levelNumber: number;
  maxTethers: number;
  targets: Array<{ x: number; y: number; radius: number; speed?: number; path?: string }>;
  hazards: Array<{ x: number; y: number; radius: number }>;
  bouncers: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  gravityPoles: Array<{ x: number; y: number; strength: number }>;
}

function generateLevel(levelIndex: number, screenBounds: { width: number; height: number }): LevelConfig {
  const rng = createPrng(levelIndex * 49297);
  const padding = 60;
  const playWidth = screenBounds.width - padding * 2;
  const playHeight = screenBounds.height - 180; // reserve UI header/footer

  const targetCount = Math.min(2 + Math.floor(levelIndex / 4), 7);
  const hazardCount = levelIndex > 10 ? Math.min(Math.floor((levelIndex - 10) / 3), 6) : 0;
  const maxTethers = Math.max(3, targetCount + 2 - Math.floor(levelIndex / 25));

  // Placement employs Poisson-Disc sampling to guarantee no overlapping entities
  const placedEntities = poissonDiscSampling(playWidth, playHeight, 70, rng);

  return {
    levelNumber: levelIndex,
    maxTethers,
    targets: placedEntities.slice(0, targetCount).map(pt => ({
      x: pt.x + padding,
      y: pt.y + 100,
      radius: 14,
      speed: levelIndex > 5 && rng() > 0.5 ? 1.5 : 0
    })),
    hazards: placedEntities.slice(targetCount, targetCount + hazardCount).map(pt => ({
      x: pt.x + padding,
      y: pt.y + 100,
      radius: 12
    })),
    bouncers: [],
    gravityPoles: []
  };
}

```

---

## 5. Animation, Tactile Feedback & Procedural Audio

Animations must be snappy and physical rather than floaty.

### 5.1 Motion Parameters

* **Tether Snapping:** Damped harmonic spring simulation ($k = 320$, $d = 24$). No linear tweens.
* **Target Shatter:** Target core splits into $4$ sharp angular facets that shoot outward at $45^\circ$, fading over $240\text{ms}$.
* **Screen Recoil:** On target impact, displace the canvas camera by $2.5\text{px}$ along the orb's impact angle for $60\text{ms}$, then damp back to zero.
* **Tether Pulse:** When the cord is held at high angular velocity ($> 12\text{ rad/s}$), line stroke width oscillates subtly between $1.0\text{px}$ and $2.2\text{px}$.

### 5.2 Assetless Web Audio Synthesis

All audio must be generated dynamically using the Web Audio API without downloading external audio files.

```typescript
class SoundSystem {
  private ctx: AudioContext = new AudioContext();

  playChime(noteIndex: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Pentatonic scale starting at C4
    const pentatonicFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const freq = pentatonicFreqs[noteIndex % pentatonicFreqs.length];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Dynamic envelope for a clean chime profile
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playSnap() {
    // White noise transient for cord pluck
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    noise.connect(filter);
    filter.connect(this.ctx.destination);
    noise.start();
  }
}

```

---

## 6. Viewport Scalability & Responsive Architecture

To guarantee the game functions identically on any mobile screen (from an iPhone SE to tall 20:9 Android flagships):

1. **Virtual Coordinate Canvas:**
* Internal simulation runs on a logical resolution of $390 \times 844$.
* All physics calculations use this fixed coordinate space.


2. **Aspect-Fit Letterboxing with Extended Bleed:**
* Render the background color (`#111215`) to cover $100\text{vw} \times 100\text{dvh}$.
* Scale the active game layer uniformly using `Math.min(windowWidth / 390, windowHeight / 844)`.
* Center the game space. Any extra vertical space becomes empty breathing room for header indicators, preventing targets from sitting under camera notches or system gesture bars.


3. **Safe Area Integration:**
* Apply CSS environment variables:
```css
padding-top: max(16px, env(safe-area-inset-top));
padding-bottom: max(16px, env(safe-area-inset-bottom));

```





---

## 7. State Machine & Architecture for the Encoding Agent

```
  +--------------+         Level Failed
  |              |<-----------------------------+
  v              |                              |
[INITIALIZE] --> [IDLE_AWAIT_TAP] --> [IN_ORBIT] --> [TARGET_CHECK]
                        ^                  |                |
                        +--- (Release) ----+                v
                                                    All targets cleared?
                                                     /              \
                                                  (Yes)             (No)
                                                   /                  \
                                          [LEVEL_VICTORY]       Tethers left?
                                                 |              /          \
                                        (Load Level+1)       (Yes)         (No)
                                                 |            /              \
                                                 +-----------+          [LEVEL_FAILED]

```

### Game State Data Contract

```typescript
type GameState = 'AWAITING_INPUT' | 'TETHERED' | 'FREE_FLIGHT' | 'VICTORY' | 'GAME_OVER';

interface RuntimeState {
  currentState: GameState;
  currentLevelIndex: number;
  tethersRemaining: number;
  scoreStreak: number;
  orb: {
    pos: { x: number; y: number };
    vel: { x: number; y: number };
    radius: number;
  };
  activeAnchor: { x: number; y: number } | null;
  targets: Array<{ id: number; x: number; y: number; active: boolean }>;
  particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }>;
}

```

---

## 8. Encoding Agent Instructions

When generating the codebase, structure the output across three clean files (or modular components if using a framework like Svelte, React, or pure Vanilla Canvas):

1. **`index.html`**: Zero-margin container with viewport meta tags locking user zoom (`user-scalable=no, viewport-fit=cover`).
2. **`audio.js`**: Pure Web Audio synthesizer containing sound routines for `snap`, `chime`, `shatter`, and `fail`.
3. **`game.js`**:
* Canvas setup with `window.devicePixelRatio` calibration to ensure high-DPI sharpness.
* Self-contained deterministic PRNG (Mulberry32 or SplitMix32) for level generation.
* $60\text{ FPS}$ fixed time-step physics loop (`requestAnimationFrame` with delta-time clamping to prevent tunneling).
* Spatial collision detection: circle-to-circle for targets; ray-line intersection for boundaries.
* Simple HUD displaying current level and remaining tethers. Clean typography, no gradients.
