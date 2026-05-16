const canvas = document.querySelector("#signal-canvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = 1;
let points = [];
let pointer = { x: 0, y: 0, active: false };

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createPoints();
}

function createPoints() {
  const count = width < 760 ? 42 : 72;
  points = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    phase: Math.random() * Math.PI * 2,
    role: index % 6 === 0 ? "signal" : index % 9 === 0 ? "risk" : "flow",
  }));
}

function draw(timestamp) {
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = Math.min(height * 0.42, 420);

  points.forEach((point) => {
    point.x += point.vx + Math.cos(timestamp * 0.00035 + point.phase) * 0.035;
    point.y += point.vy + Math.sin(timestamp * 0.00028 + point.phase) * 0.035;

    if (point.x < -40) point.x = width + 40;
    if (point.x > width + 40) point.x = -40;
    if (point.y < -40) point.y = height + 40;
    if (point.y > height + 40) point.y = -40;
  });

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    for (let j = i + 1; j < points.length; j += 1) {
      const b = points[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 148) {
        const alpha = (1 - distance / 148) * 0.18;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const pull = Math.hypot(a.x - centerX, a.y - centerY);
    if (pull < 360) {
      const alpha = (1 - pull / 360) * 0.34;
      const gradient = ctx.createLinearGradient(a.x, a.y, centerX, centerY);
      gradient.addColorStop(0, signalColor(a.role, alpha * 0.15));
      gradient.addColorStop(1, signalColor(a.role, alpha));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(centerX, centerY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const radius = a.role === "signal" ? 2.1 : 1.4;
    ctx.beginPath();
    ctx.arc(a.x, a.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = signalColor(a.role, a.role === "flow" ? 0.34 : 0.62);
    ctx.fill();
  }

  drawPricePath(timestamp);
  drawPointerField();
  requestAnimationFrame(draw);
}

function signalColor(role, alpha) {
  if (role === "signal") return `rgba(255, 157, 45, ${alpha})`;
  if (role === "risk") return `rgba(255, 85, 112, ${alpha})`;
  return `rgba(39, 228, 255, ${alpha})`;
}

function drawPricePath(timestamp) {
  const baseline = height * 0.68;
  const left = width * 0.06;
  const right = width * 0.94;
  const steps = 80;

  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const progress = i / steps;
    const x = left + (right - left) * progress;
    const wave =
      Math.sin(progress * Math.PI * 5 + timestamp * 0.00055) * 26 +
      Math.sin(progress * Math.PI * 13 + timestamp * 0.00028) * 10;
    const trend = (0.5 - progress) * 54;
    const y = baseline + wave + trend;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  const pathGradient = ctx.createLinearGradient(left, baseline, right, baseline);
  pathGradient.addColorStop(0, "rgba(255, 157, 45, 0)");
  pathGradient.addColorStop(0.22, "rgba(255, 157, 45, 0.42)");
  pathGradient.addColorStop(0.62, "rgba(53, 240, 181, 0.42)");
  pathGradient.addColorStop(1, "rgba(39, 228, 255, 0)");
  ctx.strokeStyle = pathGradient;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPointerField() {
  if (!pointer.active) return;

  const radius = 110;
  const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
  gradient.addColorStop(0, "rgba(255, 157, 45, 0.18)");
  gradient.addColorStop(0.55, "rgba(39, 228, 255, 0.08)");
  gradient.addColorStop(1, "rgba(39, 228, 255, 0)");
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY, active: true };
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

resizeCanvas();
requestAnimationFrame(draw);
