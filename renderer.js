// --- Constants ---
const SKY_COLOR = "#0077cc";
const GND_COLOR = "#8B4513";
const HORIZON_COLOR = "#fff";
const MARKER_COLOR = "#ffaa00";
const BEZEL_COLOR = "#333";

// Pixels per degree of pitch. Higher = more sensitive display.
export const PITCH_PX_PER_DEG = 3;

// Sign conventions:
//   Roll:  positive = aircraft rolls right → horizon tilts left on screen
//   Pitch: positive = nose up → horizon moves down on screen

// --- Math utilities ---

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function overdrawRadius(w, h) {
  return Math.hypot(w, h);
}

export function pitchToPixels(pitchDeg) {
  return pitchDeg * PITCH_PX_PER_DEG;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lowPass(smoothed, raw, alpha) {
  return smoothed + alpha * (raw - smoothed);
}

// --- Renderer ---

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  function draw(rollDeg, pitchDeg) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy); // clip radius (half the smaller dimension)
    const R = overdrawRadius(w, h); // oversized radius to cover corners during rotation

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Clip to circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Transform: center → roll → pitch
    ctx.translate(cx, cy); // move origin to canvas center
    ctx.rotate(-degToRad(rollDeg)); // roll: negative because horizon tilts opposite to aircraft roll
    ctx.translate(0, pitchToPixels(pitchDeg)); // pitch: nose up → horizon shifts down

    // Sky (above horizon, oversized to prevent bare corners)
    ctx.fillStyle = SKY_COLOR;
    ctx.fillRect(-R, -R, 2 * R, R);

    // Ground (below horizon, oversized)
    ctx.fillStyle = GND_COLOR;
    ctx.fillRect(-R, 0, 2 * R, R);

    // Horizon line
    ctx.strokeStyle = HORIZON_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-R, 0);
    ctx.lineTo(R, 0);
    ctx.stroke();

    // Pitch ladder (inside transformed space, moves with horizon)
    drawPitchLadder(ctx, r, R);

    ctx.restore();

    // Aircraft marker (fixed at center, unaffected by transforms)
    drawMarker(ctx, cx, cy, r);

    // Bezel ring around the instrument
    drawBezel(ctx, cx, cy, r);

    // Roll tick marks (fixed around bezel, not rotating)
    drawRollTicks(ctx, cx, cy, r);
  }

  function drawMarker(ctx, cx, cy, r) {
    const wingLen = r * 0.3;
    const wingGap = r * 0.06;
    const dotR = r * 0.04;
    const lineW = 3;

    ctx.strokeStyle = MARKER_COLOR;
    ctx.fillStyle = MARKER_COLOR;
    ctx.lineWidth = lineW;

    // Left wing line
    ctx.beginPath();
    ctx.moveTo(cx - wingGap, cy);
    ctx.lineTo(cx - wingGap - wingLen, cy);
    ctx.stroke();

    // Right wing line
    ctx.beginPath();
    ctx.moveTo(cx + wingGap, cy);
    ctx.lineTo(cx + wingGap + wingLen, cy);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPitchLadder(ctx, r) {
    const degs = [-40, -30, -20, -10, 10, 20, 30, 40];
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;

    for (const deg of degs) {
      const y = -deg * PITCH_PX_PER_DEG;
      const halfLen = Math.abs(deg) % 20 === 0 ? r * 0.25 : r * 0.15;

      ctx.beginPath();
      ctx.moveTo(-halfLen, y);
      ctx.lineTo(halfLen, y);
      ctx.stroke();
    }
  }

  function drawRollTicks(ctx, cx, cy, r) {
    const ticks = [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60];
    ctx.strokeStyle = "#fff";

    for (const deg of ticks) {
      const isLong = deg % 30 === 0;
      const len = isLong ? r * 0.1 : r * 0.05;
      ctx.lineWidth = isLong ? 2 : 1;

      // 0° roll = 12 o'clock = -PI/2 in canvas coords
      const angle = degToRad(deg) - Math.PI / 2;
      const outerX = cx + r * Math.cos(angle);
      const outerY = cy + r * Math.sin(angle);
      const innerX = cx + (r - len) * Math.cos(angle);
      const innerY = cy + (r - len) * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
      ctx.stroke();
    }
  }

  function drawBezel(ctx, cx, cy, r) {
    ctx.strokeStyle = BEZEL_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  return { resize, draw };
}
