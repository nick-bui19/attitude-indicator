const alphaEl = document.getElementById("alpha");
const betaEl = document.getElementById("beta");
const gammaEl = document.getElementById("gamma");
const permEl = document.getElementById("perm");
const btn = document.getElementById("enable");

function onOrientation(event) {
  // alpha: 0..360 (compass-ish / yaw-ish)
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
    alert("Failed to enable sensors. Open in Safari/Chrome on your phone and try again.");
  }
}

btn.addEventListener("click", enableSensors);