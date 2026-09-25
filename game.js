(() => {
  "use strict";

  const LOGICAL_WIDTH = 390;
  const LOGICAL_HEIGHT = 844;
  const COLOR_BG = "#111215";
  const COLOR_SUBTLE = "#1A1C21";
  const COLOR_UI = "#8E929C";

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

  function renderScaffold() {
    context.save();
    context.setTransform(
      viewport.scale * viewport.pixelRatio,
      0,
      0,
      viewport.scale * viewport.pixelRatio,
      0,
      0,
    );
    context.fillStyle = COLOR_BG;
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    context.strokeStyle = COLOR_SUBTLE;
    context.lineWidth = 1;
    context.strokeRect(24.5, 24.5, LOGICAL_WIDTH - 49, LOGICAL_HEIGHT - 49);

    context.fillStyle = COLOR_UI;
    context.font = "12px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("T E T H E R A", LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
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

    renderScaffold();
  }

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

  resizeCanvas();
})();
