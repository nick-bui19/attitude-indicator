import { describe, it, expect } from "vitest";
import { degToRad, overdrawRadius, pitchToPixels, PITCH_PX_PER_DEG, clamp, lowPass } from "./renderer.js";

describe("degToRad", () => {
  it("converts 0 degrees to 0 radians", () => {
    expect(degToRad(0)).toBe(0);
  });

  it("converts 180 degrees to PI radians", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it("converts -90 degrees to -PI/2 radians", () => {
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
  });
});

describe("pitchToPixels", () => {
  it("converts positive pitch to positive pixels", () => {
    expect(pitchToPixels(10)).toBe(10 * PITCH_PX_PER_DEG);
  });

  it("returns 0 for 0 pitch", () => {
    expect(pitchToPixels(0)).toBe(0);
  });

  it("converts negative pitch to negative pixels", () => {
    expect(pitchToPixels(-15)).toBe(-15 * PITCH_PX_PER_DEG);
  });
});

describe("overdrawRadius", () => {
  it("returns the diagonal for a square canvas", () => {
    expect(overdrawRadius(300, 300)).toBeCloseTo(Math.hypot(300, 300));
  });
});

describe("clamp", () => {
  it("returns value unchanged when within range", () => {
    expect(clamp(10, 0, 20)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(-45, -45, 45)).toBe(-45);
  });

  it("returns max when value equals max", () => {
    expect(clamp(45, -45, 45)).toBe(45);
  });

  it("clamps to min when value is below min", () => {
    expect(clamp(-90, -45, 45)).toBe(-45);
  });

  it("clamps to max when value is above max", () => {
    expect(clamp(80, -45, 45)).toBe(45);
  });
});

describe("lowPass", () => {
  it("moves smoothed value toward raw target", () => {
    expect(lowPass(0, 100, 0.1)).toBe(10);
  });

  it("returns smoothed unchanged when alpha is 0", () => {
    expect(lowPass(50, 100, 0)).toBe(50);
  });

  it("snaps to raw when alpha is 1", () => {
    expect(lowPass(50, 100, 1)).toBe(100);
  });

  it("converges toward target with repeated application", () => {
    let smoothed = 0;
    const target = 100;
    for (let i = 0; i < 100; i++) {
      smoothed = lowPass(smoothed, target, 0.1);
    }
    expect(smoothed).toBeCloseTo(100, 1);
  });
});
