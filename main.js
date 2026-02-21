import { createRenderer } from "./renderer.js";

// --- DOM elements ---
const alphaEl = document.getElementById("alpha");
const betaEl = document.getElementById("beta");
const gammaEl = document.getElementById("gamma");
const permEl = document.getElementById("perm");
const btn = document.getElementById("enable");
const canvas = document.getElementById("horizon");

// --- Renderer setup ---
const renderer = createRenderer(canvas);
renderer.resize();

const wrap = document.querySelector(".canvas-wrap");
const resizeObs = new ResizeObserver(() => renderer.resize());
resizeObs.observe(wrap);

// --- Hardcoded test values (will be replaced by sensor data) ---
const TEST_ROLL = 20;
const TEST_PITCH = 10;

function loop() {
  renderer.draw(TEST_ROLL, TEST_PITCH);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- Sensor permission + readout ---
function onOrientation(event) {
  // alpha: 0..360 (yaw, compass direction)
  // beta:  -180..180 (front-back tilt)
  // gamma:  -90..90 (left-right tilt)
  const a = event.alpha;
  const b = event.beta;
  const g = event.gamma;

  alphaEl.textContent = a == null ? "null" : a.toFixed(1);
  betaEl.textContent = b == null ? "null" : b.toFixed(1);
  gammaEl.textContent = g == null ? "null" : g.toFixed(1);
}

async function enableSensors() {
  // iOS 13+ requires explicit permission
  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const res = await DeviceOrientationEvent.requestPermission();
      permEl.textContent = res;
      if (res !== "granted") return;
    } else {
      permEl.textContent = "not required";
    }

    window.addEventListener("deviceorientation", onOrientation, true);
  } catch (err) {
    permEl.textContent = "error";
    console.error(err);
    alert(
      "Failed to enable sensors. Open in Safari/Chrome on your phone and try again.",
    );
  }
}

btn.addEventListener("click", enableSensors);
