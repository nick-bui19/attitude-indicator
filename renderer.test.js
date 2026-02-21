import { describe, it, expect } from "vitest";
import { degToRad, overdrawRadius, pitchToPixels, PITCH_PX_PER_DEG } from "./renderer.js";

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
