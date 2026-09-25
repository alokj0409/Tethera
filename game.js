(() => {
  "use strict";

  const LOGICAL_WIDTH = 390;
  const LOGICAL_HEIGHT = 844;

  const COLORS = Object.freeze({
    background: "#111215",
    subtle: "#1A1C21",
    orb: "#F4F2EC",
    tether: "#E87A5D",
    targetIdle: "#2D3139",
    targetActive: "#F0C05A",
    ui: "#8E929C",
  });

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
    targets: [],
    particles: [],
  };

  function createPlaceholderTargets() {
    return [
      { id: 1, x: 108, y: 278, active: true },
      { id: 2, x: 282, y: 336, active: true },
      { id: 3, x: 204, y: 184, active: true },
    ];
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
    runtime.targets = createPlaceholderTargets();
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

  function handlePointerDown(event) {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    event.preventDefault();

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

    runtime.activeAnchor = logicalPointFromPointer(event);
    runtime.activePointerId = event.pointerId;
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
    runtime.activeAnchor = null;
    runtime.activePointerId = null;
    transitionTo(GAME_STATE.FREE_FLIGHT);

    if (runtime.tethersRemaining === 0 && hasActiveTargets()) {
      transitionTo(GAME_STATE.GAME_OVER);
    }

    renderScene();
  }

  function drawHud() {
    context.fillStyle = COLORS.ui;
    context.font = "11px monospace";
    context.textBaseline = "middle";
    context.textAlign = "left";
    context.fillText(
      `LEVEL ${String(runtime.currentLevelIndex).padStart(3, "0")}`,
      28,
      52,
    );

    context.textAlign = "right";
    context.fillText(`TETHERS ${runtime.tethersRemaining}`, 362, 52);

    context.textAlign = "center";
    context.fillStyle = COLORS.subtle;
    context.fillText(runtime.currentState.replace("_", " "), 195, 79);
  }

  function drawTargets() {
    for (const target of runtime.targets) {
      if (!target.active) {
        continue;
      }

      context.beginPath();
      context.arc(target.x, target.y, 14, 0, Math.PI * 2);
      context.fillStyle = COLORS.targetIdle;
      context.fill();
      context.strokeStyle = COLORS.targetActive;
      context.lineWidth = 1;
      context.stroke();
    }
  }

  function drawOrbAndAnchor() {
    if (runtime.activeAnchor) {
      context.beginPath();
      context.moveTo(runtime.activeAnchor.x, runtime.activeAnchor.y);
      context.lineTo(runtime.orb.pos.x, runtime.orb.pos.y);
      context.strokeStyle = COLORS.tether;
      context.lineWidth = 1;
      context.stroke();

      context.beginPath();
      context.arc(runtime.activeAnchor.x, runtime.activeAnchor.y, 3, 0, Math.PI * 2);
      context.fillStyle = COLORS.tether;
      context.fill();
    }

    context.beginPath();
    context.arc(
      runtime.orb.pos.x,
      runtime.orb.pos.y,
      runtime.orb.radius,
      0,
      Math.PI * 2,
    );
    context.fillStyle = COLORS.orb;
    context.fill();
  }

  function drawStatusMessage() {
    context.textAlign = "center";
    context.textBaseline = "middle";

    if (runtime.currentState === GAME_STATE.GAME_OVER) {
      context.fillStyle = COLORS.tether;
      context.font = "14px monospace";
      context.fillText("TETHER LIMIT REACHED", 195, 672);
      context.fillStyle = COLORS.ui;
      context.font = "11px monospace";
      context.fillText("PRESS TO RESET", 195, 700);
      return;
    }

    if (runtime.currentState === GAME_STATE.VICTORY) {
      context.fillStyle = COLORS.targetActive;
      context.font = "14px monospace";
      context.fillText("FIELD CLEARED", 195, 672);
      context.fillStyle = COLORS.ui;
      context.font = "11px monospace";
      context.fillText("PRESS FOR NEXT FIELD", 195, 700);
      return;
    }

    context.fillStyle = COLORS.ui;
    context.font = "11px monospace";
    context.fillText("PRESS / HOLD / RELEASE", 195, 780);
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

    context.strokeStyle = COLORS.subtle;
    context.lineWidth = 1;
    context.strokeRect(24.5, 24.5, LOGICAL_WIDTH - 49, LOGICAL_HEIGHT - 49);

    drawHud();
    drawTargets();
    drawOrbAndAnchor();
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
  });

  resizeCanvas();
  initializeLevel();
})();
