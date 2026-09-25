(() => {
  "use strict";

  const LOGICAL_WIDTH = 390;
  const LOGICAL_HEIGHT = 844;
  const FIXED_TIME_STEP = 1 / 60;
  const MAX_FRAME_DELTA = 0.1;
  const MIN_TETHER_RADIUS = 12;
  const VECTOR_EPSILON = 1e-6;

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
    [GAME_STATE.AWAITING_INPUT]: new Set([GAME_STATE.TETHERED]),
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
  };

  function createPlaceholderTargets() {
    return [
      { id: 1, x: 108, y: 278, active: true },
      { id: 2, x: 282, y: 336, active: true },
      { id: 3, x: 204, y: 184, active: true },
    ];
  }

  function createPlaceholderHazards() {
    return [{ id: 1, x: 304, y: 528, radius: 17, rotation: -0.3 }];
  }

  function initializeLevel(levelIndex = runtime.currentLevelIndex) {
    runtime.currentState = GAME_STATE.AWAITING_INPUT;
    runtime.currentLevelIndex = levelIndex;
    runtime.tethersRemaining = 6;
    runtime.scoreStreak = 0;
    runtime.orb.pos.x = LOGICAL_WIDTH / 2;
    runtime.orb.pos.y = 536;
    runtime.orb.vel.x = 92;
    runtime.orb.vel.y = -18;
    runtime.activeAnchor = null;
    runtime.activePointerId = null;
    runtime.tether = null;
    runtime.lastTetherRadius = null;
    runtime.targets = createPlaceholderTargets();
    runtime.hazards = createPlaceholderHazards();
    runtime.particles = [];
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

  function updatePhysics(deltaSeconds) {
    if (
      runtime.currentState === GAME_STATE.VICTORY ||
      runtime.currentState === GAME_STATE.GAME_OVER
    ) {
      return;
    }

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
      return;
    }

    runtime.orb.pos.x += runtime.orb.vel.x * deltaSeconds;
    runtime.orb.pos.y += runtime.orb.vel.y * deltaSeconds;
  }

  function handlePointerDown(event) {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    event.preventDefault();
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
    runtime.lastTetherRadius = runtime.tether?.radius ?? runtime.lastTetherRadius;
    runtime.activeAnchor = null;
    runtime.activePointerId = null;
    runtime.tether = null;
    transitionTo(GAME_STATE.FREE_FLIGHT);

    if (runtime.tethersRemaining === 0 && hasActiveTargets()) {
      transitionTo(GAME_STATE.GAME_OVER);
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
      context.arc(target.x, target.y, 14, 0, Math.PI * 2);
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
      context.save();
      context.translate(hazard.x, hazard.y);
      context.rotate(hazard.rotation);
      context.fillStyle = COLORS.hazard;
      context.beginPath();
      context.moveTo(0, -hazard.radius);
      context.lineTo(hazard.radius * 0.88, hazard.radius * 0.62);
      context.lineTo(-hazard.radius * 0.88, hazard.radius * 0.62);
      context.closePath();
      context.fill();

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
      context.lineWidth = 1;
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

    drawGrid();
    drawTargets();
    drawHazards();
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
