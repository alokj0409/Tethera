(() => {
  "use strict";

  const LOGICAL_WIDTH = 390;
  const LOGICAL_HEIGHT = 844;
  const FIXED_TIME_STEP = 1 / 60;
  const MAX_FRAME_DELTA = 0.1;
  const MIN_TETHER_RADIUS = 12;
  const VECTOR_EPSILON = 1e-6;
  const LEVEL_SEED_MULTIPLIER = 49297;
  const POISSON_MIN_DISTANCE = 70;
  const MAX_IMPLEMENTED_LEVEL = 12;
  const PLAY_PADDING = 60;
  const PLAY_TOP = 100;
  const PLAY_HEIGHT = LOGICAL_HEIGHT - 180;
  const ORB_START = Object.freeze({ x: LOGICAL_WIDTH / 2, y: 690 });
  const TETHER_SPRING_K = 320;
  const TETHER_SPRING_DAMPING = 24;
  const SHATTER_LIFETIME = 0.24;
  const RECOIL_DISTANCE = 2.5;
  const RECOIL_DURATION = 0.06;
  const TETHER_PULSE_THRESHOLD = 12;
  const TARGET_ESCAPE_BOUNDS = Object.freeze({
    left: 0,
    right: LOGICAL_WIDTH,
    top: 0,
    bottom: LOGICAL_HEIGHT,
  });

  const COLORS = Object.freeze({
    background: "#111215",
    subtle: "#1A1C21",
    orb: "#F4F2EC",
    tether: "#E87A5D",
    targetIdle: "#2D3139",
    targetActive: "#F0C05A",
    hazard: "#D94E41",
    ui: "#8E929C",
  });

  const RESTART_CONTROL = Object.freeze({ x: 350, y: 794, radius: 18 });

  const GAME_STATE = Object.freeze({
    AWAITING_INPUT: "AWAITING_INPUT",
    TETHERED: "TETHERED",
    FREE_FLIGHT: "FREE_FLIGHT",
    VICTORY: "VICTORY",
    GAME_OVER: "GAME_OVER",
  });

  const ALLOWED_TRANSITIONS = Object.freeze({
    [GAME_STATE.AWAITING_INPUT]: new Set([
      GAME_STATE.TETHERED,
      GAME_STATE.VICTORY,
      GAME_STATE.GAME_OVER,
    ]),
    [GAME_STATE.TETHERED]: new Set([
      GAME_STATE.FREE_FLIGHT,
      GAME_STATE.VICTORY,
      GAME_STATE.GAME_OVER,
    ]),
    [GAME_STATE.FREE_FLIGHT]: new Set([
      GAME_STATE.TETHERED,
      GAME_STATE.VICTORY,
      GAME_STATE.GAME_OVER,
    ]),
    [GAME_STATE.VICTORY]: new Set([GAME_STATE.AWAITING_INPUT]),
    [GAME_STATE.GAME_OVER]: new Set([GAME_STATE.AWAITING_INPUT]),
  });

  const canvas = document.querySelector("#game");
  const stage = document.querySelector("#stage");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    throw new Error("TETHERA requires Canvas 2D support.");
  }

  const viewport = {
    logicalWidth: LOGICAL_WIDTH,
    logicalHeight: LOGICAL_HEIGHT,
    scale: 1,
    pixelRatio: 1,
  };

  const runtime = {
    currentState: GAME_STATE.AWAITING_INPUT,
    currentLevelIndex: 1,
    levelSeed: LEVEL_SEED_MULTIPLIER,
    tethersRemaining: 6,
    scoreStreak: 0,
    orb: {
      pos: { x: LOGICAL_WIDTH / 2, y: 536 },
      vel: { x: 92, y: -18 },
      radius: 9,
    },
    activeAnchor: null,
    activePointerId: null,
    tether: null,
    lastTetherRadius: null,
    targets: [],
    hazards: [],
    particles: [],
    tetherSnap: null,
    recoil: null,
    elapsedTime: 0,
  };

  function createMulberry32(seed) {
    let state = seed >>> 0;
    return function random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function poissonDiscSampling(
    width,
    height,
    minimumDistance,
    random,
    desiredCount,
    acceptsPoint = () => true,
  ) {
    const cellSize = minimumDistance / Math.SQRT2;
    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const grid = new Array(columns * rows).fill(null);
    const samples = [];
    const active = [];

    function gridIndex(point) {
      return (
        Math.floor(point.y / cellSize) * columns +
        Math.floor(point.x / cellSize)
      );
    }

    function insert(point) {
      samples.push(point);
      active.push(point);
      grid[gridIndex(point)] = point;
    }

    function isValid(point) {
      if (
        point.x < 0 ||
        point.x >= width ||
        point.y < 0 ||
        point.y >= height ||
        !acceptsPoint(point)
      ) {
        return false;
      }

      const column = Math.floor(point.x / cellSize);
      const row = Math.floor(point.y / cellSize);
      for (let y = Math.max(0, row - 2); y <= Math.min(rows - 1, row + 2); y += 1) {
        for (
          let x = Math.max(0, column - 2);
          x <= Math.min(columns - 1, column + 2);
          x += 1
        ) {
          const neighbor = grid[y * columns + x];
          if (
            neighbor &&
            Math.hypot(point.x - neighbor.x, point.y - neighbor.y) <
              minimumDistance
          ) {
            return false;
          }
        }
      }
      return true;
    }

    for (let attempt = 0; attempt < 100 && samples.length === 0; attempt += 1) {
      const firstPoint = { x: random() * width, y: random() * height };
      if (acceptsPoint(firstPoint)) {
        insert(firstPoint);
      }
    }

    while (active.length > 0 && samples.length < desiredCount) {
      const activeIndex = Math.floor(random() * active.length);
      const origin = active[activeIndex];
      let placed = false;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        const angle = random() * Math.PI * 2;
        const distance = minimumDistance * (1 + random());
        const candidate = {
          x: origin.x + Math.cos(angle) * distance,
          y: origin.y + Math.sin(angle) * distance,
        };

        if (isValid(candidate)) {
          insert(candidate);
          placed = true;
          break;
        }
      }

      if (!placed) {
        active.splice(activeIndex, 1);
      }
    }

    if (samples.length < desiredCount) {
      throw new Error(
        `Poisson sampler produced ${samples.length}/${desiredCount} points.`,
      );
    }

    return samples;
  }

  function generateLevel(levelIndex) {
    if (
      !Number.isInteger(levelIndex) ||
      levelIndex < 1 ||
      levelIndex > MAX_IMPLEMENTED_LEVEL
    ) {
      throw new RangeError(
        `Level generation supports Levels 1 through ${MAX_IMPLEMENTED_LEVEL}.`,
      );
    }

    const seed = Math.imul(levelIndex, LEVEL_SEED_MULTIPLIER) >>> 0;
    const random = createMulberry32(seed);
    const targetCount = Math.min(2 + Math.floor(levelIndex / 4), 7);
    const formulaTethers = Math.max(
      3,
      targetCount + 2 - Math.floor(levelIndex / 25),
    );
    const maxTethers =
      levelIndex <= 5 ? Math.max(6, formulaTethers) : formulaTethers;
    const playWidth = LOGICAL_WIDTH - PLAY_PADDING * 2;
    const acceptsPoint = (point) =>
      Math.hypot(
        point.x + PLAY_PADDING - ORB_START.x,
        point.y + PLAY_TOP - ORB_START.y,
      ) >= 110;
    const points = poissonDiscSampling(
      playWidth,
      PLAY_HEIGHT,
      POISSON_MIN_DISTANCE,
      random,
      targetCount,
      acceptsPoint,
    );
    const targets = points.map((point, index) => ({
      id: index + 1,
      x: point.x + PLAY_PADDING,
      y: point.y + PLAY_TOP,
      radius: 14,
      active: true,
      motion: null,
    }));

    if (levelIndex >= 6) {
      for (const [index, target] of targets.entries()) {
        if (index !== 0 && random() <= 0.5) {
          continue;
        }

        const speed = 72 + random() * 18;
        if (random() < 0.5) {
          const inwardAngle = Math.atan2(
            LOGICAL_HEIGHT / 2 - target.y,
            LOGICAL_WIDTH / 2 - target.x,
          );
          const angle = inwardAngle + (random() - 0.5);
          target.motion = {
            type: "linear",
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          };
        } else {
          const radius = 12 + random() * 8;
          const phase = random() * Math.PI * 2;
          const direction = random() < 0.5 ? -1 : 1;
          target.motion = {
            type: "circular",
            centerX: target.x - Math.cos(phase) * radius,
            centerY: target.y - Math.sin(phase) * radius,
            radius,
            phase,
            angularSpeed: direction * (speed / radius),
          };
        }
      }
    }

    const launchAngle = -Math.PI * (0.58 + random() * 0.34);
    const launchSpeed = 82 + random() * 18;

    return {
      levelNumber: levelIndex,
      seed,
      maxTethers,
      orb: {
        x: ORB_START.x,
        y: ORB_START.y,
        vx: Math.cos(launchAngle) * launchSpeed,
        vy: Math.sin(launchAngle) * launchSpeed,
      },
      targets,
      hazards: [],
      bouncers: [],
      gravityPoles: [],
    };
  }

  function initializeLevel(levelIndex = runtime.currentLevelIndex) {
    const playableLevelIndex =
      ((levelIndex - 1) % MAX_IMPLEMENTED_LEVEL) + 1;
    const level = generateLevel(playableLevelIndex);
    runtime.currentState = GAME_STATE.AWAITING_INPUT;
    runtime.currentLevelIndex = level.levelNumber;
    runtime.levelSeed = level.seed;
    runtime.tethersRemaining = level.maxTethers;
    runtime.scoreStreak = 0;
    runtime.orb.pos.x = level.orb.x;
    runtime.orb.pos.y = level.orb.y;
    runtime.orb.vel.x = level.orb.vx;
    runtime.orb.vel.y = level.orb.vy;
    runtime.activeAnchor = null;
    runtime.activePointerId = null;
    runtime.tether = null;
    runtime.lastTetherRadius = null;
    runtime.targets = level.targets;
    runtime.hazards = level.hazards;
    runtime.particles = [];
    runtime.tetherSnap = null;
    runtime.recoil = null;
    runtime.elapsedTime = 0;
    renderScene();
  }

  function transitionTo(nextState) {
    const allowed = ALLOWED_TRANSITIONS[runtime.currentState];
    if (!allowed?.has(nextState)) {
      throw new Error(
        `Invalid TETHERA state transition: ${runtime.currentState} -> ${nextState}`,
      );
    }

    runtime.currentState = nextState;
  }

  function logicalPointFromPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * LOGICAL_WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * LOGICAL_HEIGHT,
    };
  }

  function hasActiveTargets() {
    return runtime.targets.some((target) => target.active);
  }

  function playSound(method, ...args) {
    window.TetheraAudio?.[method]?.(...args);
  }

  function createTether(pointerAnchor) {
    let anchor = { ...pointerAnchor };
    let radialX = runtime.orb.pos.x - anchor.x;
    let radialY = runtime.orb.pos.y - anchor.y;
    let radius = Math.hypot(radialX, radialY);

    if (radius < MIN_TETHER_RADIUS) {
      const speed = Math.hypot(runtime.orb.vel.x, runtime.orb.vel.y);
      const unitRadialX =
        speed > VECTOR_EPSILON ? runtime.orb.vel.y / speed : 1;
      const unitRadialY =
        speed > VECTOR_EPSILON ? -runtime.orb.vel.x / speed : 0;

      anchor = {
        x: runtime.orb.pos.x - unitRadialX * MIN_TETHER_RADIUS,
        y: runtime.orb.pos.y - unitRadialY * MIN_TETHER_RADIUS,
      };
      radialX = unitRadialX * MIN_TETHER_RADIUS;
      radialY = unitRadialY * MIN_TETHER_RADIUS;
      radius = MIN_TETHER_RADIUS;
    }

    const tangentX = -radialY / radius;
    const tangentY = radialX / radius;
    const projectedSpeed =
      runtime.orb.vel.x * tangentX + runtime.orb.vel.y * tangentY;
    const whipScalar =
      runtime.lastTetherRadius !== null && radius < runtime.lastTetherRadius
        ? (runtime.lastTetherRadius / radius) ** 0.65
        : 1;
    const tangentialSpeed = projectedSpeed * whipScalar;

    runtime.orb.vel.x = tangentX * tangentialSpeed;
    runtime.orb.vel.y = tangentY * tangentialSpeed;

    return {
      anchor,
      radius,
      angle: Math.atan2(radialY, radialX),
      tangentialSpeed,
      whipScalar,
    };
  }

  function squaredDistancePointToSegment(point, segmentStart, segmentEnd) {
    const segmentX = segmentEnd.x - segmentStart.x;
    const segmentY = segmentEnd.y - segmentStart.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared <= VECTOR_EPSILON) {
      const dx = point.x - segmentStart.x;
      const dy = point.y - segmentStart.y;
      return dx * dx + dy * dy;
    }

    const projection = Math.max(
      0,
      Math.min(
        1,
        ((point.x - segmentStart.x) * segmentX +
          (point.y - segmentStart.y) * segmentY) /
          segmentLengthSquared,
      ),
    );
    const nearestX = segmentStart.x + segmentX * projection;
    const nearestY = segmentStart.y + segmentY * projection;
    const dx = point.x - nearestX;
    const dy = point.y - nearestY;
    return dx * dx + dy * dy;
  }

  function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function segmentsIntersect(a, b, c, d) {
    const abC = cross(a, b, c);
    const abD = cross(a, b, d);
    const cdA = cross(c, d, a);
    const cdB = cross(c, d, b);

    if (
      ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) &&
      ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0))
    ) {
      return true;
    }

    return (
      (Math.abs(abC) <= VECTOR_EPSILON &&
        squaredDistancePointToSegment(c, a, b) <= VECTOR_EPSILON) ||
      (Math.abs(abD) <= VECTOR_EPSILON &&
        squaredDistancePointToSegment(d, a, b) <= VECTOR_EPSILON) ||
      (Math.abs(cdA) <= VECTOR_EPSILON &&
        squaredDistancePointToSegment(a, c, d) <= VECTOR_EPSILON) ||
      (Math.abs(cdB) <= VECTOR_EPSILON &&
        squaredDistancePointToSegment(b, c, d) <= VECTOR_EPSILON)
    );
  }

  function squaredDistanceSegmentToSegment(a, b, c, d) {
    if (segmentsIntersect(a, b, c, d)) {
      return 0;
    }

    return Math.min(
      squaredDistancePointToSegment(a, c, d),
      squaredDistancePointToSegment(b, c, d),
      squaredDistancePointToSegment(c, a, b),
      squaredDistancePointToSegment(d, a, b),
    );
  }

  function getHazardVertices(hazard) {
    const cosine = Math.cos(hazard.rotation);
    const sine = Math.sin(hazard.rotation);
    return [
      { x: 0, y: -hazard.radius },
      { x: hazard.radius * 0.88, y: hazard.radius * 0.62 },
      { x: -hazard.radius * 0.88, y: hazard.radius * 0.62 },
    ].map((point) => ({
      x: hazard.x + point.x * cosine - point.y * sine,
      y: hazard.y + point.x * sine + point.y * cosine,
    }));
  }

  function pointInTriangle(point, vertices) {
    const signs = vertices.map((vertex, index) =>
      cross(vertex, vertices[(index + 1) % vertices.length], point),
    );
    const hasNegative = signs.some((value) => value < -VECTOR_EPSILON);
    const hasPositive = signs.some((value) => value > VECTOR_EPSILON);
    return !(hasNegative && hasPositive);
  }

  function sweptOrbHitsHazard(start, end, hazard) {
    const vertices = getHazardVertices(hazard);
    if (pointInTriangle(start, vertices) || pointInTriangle(end, vertices)) {
      return true;
    }

    const radiusSquared = runtime.orb.radius * runtime.orb.radius;
    return vertices.some((vertex, index) => {
      const nextVertex = vertices[(index + 1) % vertices.length];
      return (
        squaredDistanceSegmentToSegment(start, end, vertex, nextVertex) <=
        radiusSquared
      );
    });
  }

  function enterTerminalState(state) {
    runtime.activeAnchor = null;
    runtime.activePointerId = null;
    runtime.tether = null;
    transitionTo(state);
    if (state === GAME_STATE.GAME_OVER) {
      playSound("playFail");
    } else if (state === GAME_STATE.VICTORY) {
      playSound("playChime", runtime.scoreStreak + 2);
    }
  }

  function spawnShatter(target) {
    const facetSpeed = 92;
    for (let index = 0; index < 4; index += 1) {
      const angle = Math.PI / 4 + index * (Math.PI / 2);
      runtime.particles.push({
        x: target.x,
        y: target.y,
        vx: Math.cos(angle) * facetSpeed,
        vy: Math.sin(angle) * facetSpeed,
        rotation: angle,
        spin: index % 2 === 0 ? 9 : -9,
        life: SHATTER_LIFETIME,
        maxLife: SHATTER_LIFETIME,
      });
    }

    const speed = Math.hypot(runtime.orb.vel.x, runtime.orb.vel.y);
    const impactX = speed > VECTOR_EPSILON ? runtime.orb.vel.x / speed : 1;
    const impactY = speed > VECTOR_EPSILON ? runtime.orb.vel.y / speed : 0;
    runtime.recoil = {
      x: impactX * RECOIL_DISTANCE,
      y: impactY * RECOIL_DISTANCE,
      life: RECOIL_DURATION,
      maxLife: RECOIL_DURATION,
    };
  }

  function updateEffects(deltaSeconds) {
    runtime.elapsedTime += deltaSeconds;

    for (const particle of runtime.particles) {
      particle.x += particle.vx * deltaSeconds;
      particle.y += particle.vy * deltaSeconds;
      particle.rotation += particle.spin * deltaSeconds;
      particle.life -= deltaSeconds;
    }
    runtime.particles = runtime.particles.filter((particle) => particle.life > 0);

    if (runtime.recoil) {
      runtime.recoil.life -= deltaSeconds;
      if (runtime.recoil.life <= 0) {
        runtime.recoil = null;
      }
    }

    if (runtime.tetherSnap) {
      const spring = runtime.tetherSnap;
      const acceleration =
        -TETHER_SPRING_K * spring.displacement -
        TETHER_SPRING_DAMPING * spring.velocity;
      spring.velocity += acceleration * deltaSeconds;
      spring.displacement += spring.velocity * deltaSeconds;
      spring.age += deltaSeconds;

      if (
        spring.age >= 0.45 ||
        (Math.abs(spring.displacement) < 0.002 &&
          Math.abs(spring.velocity) < 0.02)
      ) {
        runtime.tetherSnap = null;
      }
    }
  }

  function targetHasEscaped(target) {
    return (
      target.x + target.radius < TARGET_ESCAPE_BOUNDS.left ||
      target.x - target.radius > TARGET_ESCAPE_BOUNDS.right ||
      target.y + target.radius < TARGET_ESCAPE_BOUNDS.top ||
      target.y - target.radius > TARGET_ESCAPE_BOUNDS.bottom
    );
  }

  function updateMovingTargets(deltaSeconds) {
    const starts = new Map();

    for (const target of runtime.targets) {
      if (!target.active) {
        continue;
      }

      starts.set(target.id, { x: target.x, y: target.y });
      if (!target.motion) {
        continue;
      }

      if (target.motion.type === "linear") {
        target.x += target.motion.vx * deltaSeconds;
        target.y += target.motion.vy * deltaSeconds;
      } else if (target.motion.type === "circular") {
        target.motion.phase += target.motion.angularSpeed * deltaSeconds;
        target.x =
          target.motion.centerX +
          Math.cos(target.motion.phase) * target.motion.radius;
        target.y =
          target.motion.centerY +
          Math.sin(target.motion.phase) * target.motion.radius;
      }

      if (targetHasEscaped(target)) {
        enterTerminalState(GAME_STATE.GAME_OVER);
        return { starts, escaped: true };
      }
    }

    return { starts, escaped: false };
  }

  function resolveCollisions(start, end, targetStarts) {
    if (runtime.hazards.some((hazard) => sweptOrbHitsHazard(start, end, hazard))) {
      enterTerminalState(GAME_STATE.GAME_OVER);
      return;
    }

    for (const target of runtime.targets) {
      if (!target.active) {
        continue;
      }

      const targetStart = targetStarts.get(target.id) ?? target;
      const relativeStart = {
        x: start.x - targetStart.x,
        y: start.y - targetStart.y,
      };
      const relativeEnd = {
        x: end.x - target.x,
        y: end.y - target.y,
      };
      const contactRadius = runtime.orb.radius + target.radius;
      if (
        squaredDistancePointToSegment(
          { x: 0, y: 0 },
          relativeStart,
          relativeEnd,
        ) <=
        contactRadius * contactRadius
      ) {
        target.active = false;
        runtime.scoreStreak += 1;
        spawnShatter(target);
        playSound("playShatter");
        playSound("playChime", runtime.scoreStreak - 1);
      }
    }

    if (!hasActiveTargets()) {
      enterTerminalState(GAME_STATE.VICTORY);
    }
  }

  function updatePhysics(deltaSeconds) {
    updateEffects(deltaSeconds);

    if (
      runtime.currentState === GAME_STATE.VICTORY ||
      runtime.currentState === GAME_STATE.GAME_OVER
    ) {
      return;
    }

    const movingTargets = updateMovingTargets(deltaSeconds);
    if (movingTargets.escaped) {
      return;
    }

    const start = { x: runtime.orb.pos.x, y: runtime.orb.pos.y };

    if (runtime.currentState === GAME_STATE.TETHERED && runtime.tether) {
      const tether = runtime.tether;
      tether.angle += (tether.tangentialSpeed / tether.radius) * deltaSeconds;

      const radialX = Math.cos(tether.angle);
      const radialY = Math.sin(tether.angle);
      const tangentX = -radialY;
      const tangentY = radialX;

      runtime.orb.pos.x = tether.anchor.x + radialX * tether.radius;
      runtime.orb.pos.y = tether.anchor.y + radialY * tether.radius;
      runtime.orb.vel.x = tangentX * tether.tangentialSpeed;
      runtime.orb.vel.y = tangentY * tether.tangentialSpeed;
      resolveCollisions(start, runtime.orb.pos, movingTargets.starts);
      return;
    }

    runtime.orb.pos.x += runtime.orb.vel.x * deltaSeconds;
    runtime.orb.pos.y += runtime.orb.vel.y * deltaSeconds;
    resolveCollisions(start, runtime.orb.pos, movingTargets.starts);
  }

  function handlePointerDown(event) {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    event.preventDefault();
    window.TetheraAudio?.unlock();
    const pointerPoint = logicalPointFromPointer(event);

    if (
      Math.hypot(
        pointerPoint.x - RESTART_CONTROL.x,
        pointerPoint.y - RESTART_CONTROL.y,
      ) <= RESTART_CONTROL.radius
    ) {
      initializeLevel(runtime.currentLevelIndex);
      return;
    }

    if (
      runtime.currentState === GAME_STATE.GAME_OVER ||
      runtime.currentState === GAME_STATE.VICTORY
    ) {
      const level =
        runtime.currentState === GAME_STATE.VICTORY
          ? runtime.currentLevelIndex + 1
          : runtime.currentLevelIndex;
      transitionTo(GAME_STATE.AWAITING_INPUT);
      initializeLevel(level);
      return;
    }

    if (
      runtime.currentState === GAME_STATE.TETHERED ||
      runtime.tethersRemaining <= 0
    ) {
      return;
    }

    const tether = createTether(pointerPoint);
    runtime.activeAnchor = tether.anchor;
    runtime.activePointerId = event.pointerId;
    runtime.tether = tether;
    runtime.tethersRemaining -= 1;
    canvas.setPointerCapture(event.pointerId);
    transitionTo(GAME_STATE.TETHERED);
    renderScene();
  }

  function releaseActiveTether(event) {
    if (
      runtime.currentState !== GAME_STATE.TETHERED ||
      event.pointerId !== runtime.activePointerId
    ) {
      return;
    }

    event.preventDefault();
    runtime.tetherSnap = {
      anchor: { ...runtime.activeAnchor },
      end: { x: runtime.orb.pos.x, y: runtime.orb.pos.y },
      displacement: 1,
      velocity: 0,
      age: 0,
    };
    runtime.lastTetherRadius = runtime.tether?.radius ?? runtime.lastTetherRadius;
    runtime.activeAnchor = null;
    runtime.activePointerId = null;
    runtime.tether = null;
    transitionTo(GAME_STATE.FREE_FLIGHT);
    playSound("playSnap");

    if (runtime.tethersRemaining === 0 && hasActiveTargets()) {
      enterTerminalState(GAME_STATE.GAME_OVER);
    }

    renderScene();
  }

  function drawTrackedText(text, x, y, options = {}) {
    const {
      align = "left",
      color = COLORS.ui,
      fontSize = 11,
      tracking = fontSize * 0.12,
    } = options;
    const glyphs = [...text.toUpperCase()];
    context.font = `${fontSize}px "SFMono-Regular", Consolas, "Liberation Mono", monospace`;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = color;

    const widths = glyphs.map((glyph) => context.measureText(glyph).width);
    const textWidth =
      widths.reduce((total, width) => total + width, 0) +
      Math.max(0, glyphs.length - 1) * tracking;
    let cursorX =
      align === "center" ? x - textWidth / 2 : align === "right" ? x - textWidth : x;

    glyphs.forEach((glyph, index) => {
      context.fillText(glyph, cursorX, y);
      cursorX += widths[index] + tracking;
    });
  }

  function drawGrid() {
    context.strokeStyle = COLORS.subtle;
    context.lineWidth = 1;

    for (let y = 128; y <= 704; y += 96) {
      for (let x = 51; x <= 339; x += 72) {
        context.beginPath();
        context.moveTo(x - 2.5, y + 0.5);
        context.lineTo(x + 2.5, y + 0.5);
        context.moveTo(x + 0.5, y - 2.5);
        context.lineTo(x + 0.5, y + 2.5);
        context.stroke();
      }
    }
  }

  function drawHud() {
    const activeTargets = runtime.targets.filter((target) => target.active).length;
    const clearedTargets = runtime.targets.length - activeTargets;

    drawTrackedText(
      `LEVEL ${String(runtime.currentLevelIndex).padStart(3, "0")}`,
      28,
      48,
    );
    drawTrackedText(
      `TARGETS ${clearedTargets}/${runtime.targets.length}`,
      362,
      48,
      { align: "right" },
    );

    context.strokeStyle = COLORS.subtle;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(28, 70.5);
    context.lineTo(362, 70.5);
    context.stroke();

    drawTrackedText(`TETHERS ${runtime.tethersRemaining}`, 28, 795);
  }

  function drawRestartControl() {
    const { x, y } = RESTART_CONTROL;
    context.strokeStyle = COLORS.ui;
    context.fillStyle = COLORS.ui;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 8, -Math.PI * 0.35, Math.PI * 1.35);
    context.stroke();

    context.beginPath();
    context.moveTo(x + 7.5, y - 6.5);
    context.lineTo(x + 11.5, y - 7.5);
    context.lineTo(x + 9, y - 3.5);
    context.closePath();
    context.fill();
  }

  function drawTargets() {
    for (const target of runtime.targets) {
      if (!target.active) {
        continue;
      }

      context.strokeStyle = COLORS.targetIdle;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(target.x, target.y, 9, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = COLORS.targetActive;
      context.beginPath();
      context.arc(target.x, target.y, 3.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawHazards() {
    for (const hazard of runtime.hazards) {
      const vertices = getHazardVertices(hazard);
      context.fillStyle = COLORS.hazard;
      context.beginPath();
      context.moveTo(vertices[0].x, vertices[0].y);
      context.lineTo(vertices[1].x, vertices[1].y);
      context.lineTo(vertices[2].x, vertices[2].y);
      context.closePath();
      context.fill();

      context.save();
      context.translate(hazard.x, hazard.y);
      context.rotate(hazard.rotation);
      context.fillStyle = COLORS.background;
      context.beginPath();
      context.moveTo(0, -hazard.radius * 0.42);
      context.lineTo(hazard.radius * 0.36, hazard.radius * 0.25);
      context.lineTo(-hazard.radius * 0.36, hazard.radius * 0.25);
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  function drawShatterParticles() {
    for (const particle of runtime.particles) {
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = COLORS.targetActive;
      context.beginPath();
      context.moveTo(0, -5);
      context.lineTo(3.2, 3.5);
      context.lineTo(-2.4, 2.2);
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  function drawTetherSnap() {
    if (!runtime.tetherSnap) {
      return;
    }

    const spring = runtime.tetherSnap;
    const endX =
      spring.anchor.x + (spring.end.x - spring.anchor.x) * spring.displacement;
    const endY =
      spring.anchor.y + (spring.end.y - spring.anchor.y) * spring.displacement;
    context.save();
    context.globalAlpha = Math.min(1, Math.abs(spring.displacement) * 1.5);
    context.strokeStyle = COLORS.tether;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(spring.anchor.x, spring.anchor.y);
    context.lineTo(endX, endY);
    context.stroke();
    context.restore();
  }

  function drawOrbAndAnchor() {
    if (runtime.tether && runtime.activeAnchor) {
      context.strokeStyle = COLORS.subtle;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(
        runtime.activeAnchor.x,
        runtime.activeAnchor.y,
        runtime.tether.radius,
        0,
        Math.PI * 2,
      );
      context.stroke();

      context.beginPath();
      context.moveTo(runtime.activeAnchor.x, runtime.activeAnchor.y);
      context.lineTo(runtime.orb.pos.x, runtime.orb.pos.y);
      context.strokeStyle = COLORS.tether;
      const angularVelocity = Math.abs(
        runtime.tether.tangentialSpeed / runtime.tether.radius,
      );
      context.lineWidth =
        angularVelocity > TETHER_PULSE_THRESHOLD
          ? 1.6 + Math.sin(runtime.elapsedTime * 30) * 0.6
          : 1;
      context.stroke();

      context.fillStyle = COLORS.background;
      context.strokeStyle = COLORS.tether;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(runtime.activeAnchor.x, runtime.activeAnchor.y, 4, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = COLORS.tether;
      context.beginPath();
      context.arc(runtime.activeAnchor.x, runtime.activeAnchor.y, 1.5, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = COLORS.orb;
    context.beginPath();
    context.arc(
      runtime.orb.pos.x,
      runtime.orb.pos.y,
      runtime.orb.radius,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.fillStyle = COLORS.background;
    context.beginPath();
    context.arc(runtime.orb.pos.x, runtime.orb.pos.y, 2, 0, Math.PI * 2);
    context.fill();
  }

  function drawStatusMessage() {
    if (runtime.currentState === GAME_STATE.GAME_OVER) {
      context.fillStyle = COLORS.subtle;
      context.fillRect(48, 650, 294, 72);
      drawTrackedText("TETHER LIMIT REACHED", 195, 676, {
        align: "center",
        color: COLORS.hazard,
        fontSize: 13,
      });
      drawTrackedText("PRESS TO RESET", 195, 704, { align: "center" });
      return;
    }

    if (runtime.currentState === GAME_STATE.VICTORY) {
      context.fillStyle = COLORS.subtle;
      context.fillRect(48, 650, 294, 72);
      drawTrackedText("FIELD CLEARED", 195, 676, {
        align: "center",
        color: COLORS.targetActive,
        fontSize: 13,
      });
      drawTrackedText("PRESS FOR NEXT FIELD", 195, 704, { align: "center" });
      return;
    }

    if (runtime.currentState === GAME_STATE.AWAITING_INPUT) {
      drawTrackedText("PRESS TO TETHER", 195, 754, { align: "center" });
    }
  }

  function renderScene() {
    context.save();
    context.setTransform(
      viewport.scale * viewport.pixelRatio,
      0,
      0,
      viewport.scale * viewport.pixelRatio,
      0,
      0,
    );
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (runtime.recoil) {
      const recoilProgress = runtime.recoil.life / runtime.recoil.maxLife;
      const dampedProgress = recoilProgress * recoilProgress;
      context.translate(
        runtime.recoil.x * dampedProgress,
        runtime.recoil.y * dampedProgress,
      );
    }

    drawGrid();
    drawTargets();
    drawHazards();
    drawShatterParticles();
    drawTetherSnap();
    drawOrbAndAnchor();
    drawHud();
    drawRestartControl();
    drawStatusMessage();
    context.restore();
  }

  function resizeCanvas() {
    const availableWidth = stage.clientWidth;
    const availableHeight = stage.clientHeight;
    const scale = Math.min(
      availableWidth / LOGICAL_WIDTH,
      availableHeight / LOGICAL_HEIGHT,
    );
    const pixelRatio = window.devicePixelRatio || 1;
    const displayWidth = LOGICAL_WIDTH * scale;
    const displayHeight = LOGICAL_HEIGHT * scale;

    viewport.scale = scale;
    viewport.pixelRatio = pixelRatio;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = Math.max(1, Math.round(displayWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(displayHeight * pixelRatio));

    renderScene();
  }

  let previousFrameTime = null;
  let accumulatedTime = 0;

  function frame(timestamp) {
    if (previousFrameTime === null) {
      previousFrameTime = timestamp;
    }

    const frameDelta = Math.min(
      (timestamp - previousFrameTime) / 1000,
      MAX_FRAME_DELTA,
    );
    previousFrameTime = timestamp;
    accumulatedTime += frameDelta;

    while (accumulatedTime >= FIXED_TIME_STEP) {
      updatePhysics(FIXED_TIME_STEP);
      accumulatedTime -= FIXED_TIME_STEP;
    }

    renderScene();
    window.requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", releaseActiveTether);
  canvas.addEventListener("pointercancel", releaseActiveTether);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(stage);
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.visualViewport?.addEventListener("resize", resizeCanvas, { passive: true });

  window.TetheraViewport = Object.freeze({
    canvas,
    context,
    metrics: viewport,
    resize: resizeCanvas,
  });
  window.TetheraGame = Object.freeze({
    states: GAME_STATE,
    getState: () => structuredClone(runtime),
    generateLevel: (levelIndex) => structuredClone(generateLevel(levelIndex)),
    loadLevelForDiagnostics: (levelIndex) => initializeLevel(levelIndex),
    resetLevel: () => initializeLevel(runtime.currentLevelIndex),
    stepForDiagnostics: (seconds = FIXED_TIME_STEP) => {
      updatePhysics(seconds);
      renderScene();
    },
  });

  resizeCanvas();
  initializeLevel();
  window.requestAnimationFrame(frame);
})();
