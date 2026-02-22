// --- Constants ---
const HORIZON_COLOR = "#fff";
const MARKER_COLOR = "#ffaa00";

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

    // Sky gradient (dark navy at top → lighter blue at horizon)
    const skyGrad = ctx.createLinearGradient(0, -R, 0, 0);
    skyGrad.addColorStop(0, "#001a3a");
    skyGrad.addColorStop(1, "#0068b4");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-R, -R, 2 * R, R);

    // Ground gradient (brown at horizon → dark brown at bottom)
    const gndGrad = ctx.createLinearGradient(0, 0, 0, R);
    gndGrad.addColorStop(0, "#6b3410");
    gndGrad.addColorStop(1, "#2a1508");
    ctx.fillStyle = gndGrad;
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

    // Roll pointer triangle (rotates with roll, sits at top of circle)
    drawRollPointer(ctx, cx, cy, r, rollDeg);

    // Data readout (roll / pitch text)
    drawReadout(ctx, cx, cy, r, rollDeg, pitchDeg);
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

    const fontSize = Math.max(9, r * 0.07);
    ctx.font = `${fontSize}px "SF Mono", "Fira Code", "Consolas", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textBaseline = "middle";

    for (const deg of degs) {
      const y = -deg * PITCH_PX_PER_DEG;
      const halfLen = Math.abs(deg) % 20 === 0 ? r * 0.25 : r * 0.15;

      ctx.beginPath();
      ctx.moveTo(-halfLen, y);
      ctx.lineTo(halfLen, y);
      ctx.stroke();

      // Degree labels on both sides
      const label = Math.abs(deg).toString();
      const pad = fontSize * 0.4;
      ctx.textAlign = "right";
      ctx.fillText(label, -halfLen - pad, y);
      ctx.textAlign = "left";
      ctx.fillText(label, halfLen + pad, y);
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

  function drawReadout(ctx, cx, cy, r, rollDeg, pitchDeg) {
    const fontSize = Math.max(10, r * 0.08);
    ctx.font = `${fontSize}px "SF Mono", "Fira Code", "Consolas", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const rollText = `R ${rollDeg >= 0 ? "+" : ""}${rollDeg.toFixed(1)}°`;
    const pitchText = `P ${pitchDeg >= 0 ? "+" : ""}${pitchDeg.toFixed(1)}°`;
    const lineH = fontSize * 1.4;
    const blockY = cy + r * 0.7;

    // Background pill
    const textW = Math.max(ctx.measureText(rollText).width, ctx.measureText(pitchText).width);
    const padX = fontSize * 0.6;
    const padY = fontSize * 0.3;
    const pillW = textW + padX * 2;
    const pillH = lineH * 2 + padY * 2;
    const pillR = fontSize * 0.4;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, blockY - pillH / 2, pillW, pillH, pillR);
    ctx.fill();

    // Text
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(rollText, cx, blockY - lineH / 2);
    ctx.fillText(pitchText, cx, blockY + lineH / 2);
  }

  function drawRollPointer(ctx, cx, cy, r, rollDeg) {
    const size = r * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-degToRad(rollDeg));

    // Small triangle at 12 o'clock pointing inward
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(0, -r + 2);               // tip (just inside circle edge)
    ctx.lineTo(-size, -r - size * 0.8);   // upper-left
    ctx.lineTo(size, -r - size * 0.8);    // upper-right
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawBezel(ctx, cx, cy, r) {
    // Outer bezel ring — thick dark metallic band
    const bezelWidth = r * 0.08;
    const outerR = r + bezelWidth / 2;

    // Metallic gradient across the bezel
    const grad = ctx.createLinearGradient(cx, cy - outerR, cx, cy + outerR);
    grad.addColorStop(0, "#555");
    grad.addColorStop(0.3, "#2a2a2a");
    grad.addColorStop(0.5, "#444");
    grad.addColorStop(0.7, "#2a2a2a");
    grad.addColorStop(1, "#1a1a1a");

    ctx.strokeStyle = grad;
    ctx.lineWidth = bezelWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner shadow ring — subtle dark edge for depth
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Outer highlight ring — thin bright edge
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + bezelWidth, 0, Math.PI * 2);
    ctx.stroke();
  }

  return { resize, draw };
}
