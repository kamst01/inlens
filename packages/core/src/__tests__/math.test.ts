import { describe, expect, it } from "vitest";
import {
  clamp,
  computeLensPosition,
  computeMagnifiedTranslate,
  computeTrackerRect,
} from "../index";

describe("clamp", () => {
  it("clamps to an inclusive range", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it.each([Number.NaN, Infinity, -Infinity])("rejects non-finite input %s", (value) => {
    expect(() => clamp(value, 0, 1)).toThrow(RangeError);
    expect(() => clamp(0, value, 1)).toThrow(RangeError);
    expect(() => clamp(0, 1, value)).toThrow(RangeError);
  });

  it("rejects an inverted range", () => {
    expect(() => clamp(0, 2, 1)).toThrow(/min must be less/);
  });
});

describe("computeLensPosition", () => {
  it.each([
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    [
      { x: 1, y: 0 },
      { x: 80, y: 0 },
    ],
    [
      { x: 0, y: 1 },
      { x: 0, y: 60 },
    ],
    [
      { x: 1, y: 1 },
      { x: 80, y: 60 },
    ],
    [
      { x: 0.5, y: 0.5 },
      { x: 40, y: 30 },
    ],
  ])("places cursor %j at %j", (cursor, expected) => {
    expect(computeLensPosition(cursor, 100, 80, 20, 20)).toEqual(expected);
  });

  it("supports a lens equal to or larger than the root", () => {
    expect(computeLensPosition({ x: 0.5, y: 0.5 }, 100, 80, 100, 80)).toEqual({
      x: 0,
      y: 0,
    });
    expect(computeLensPosition({ x: 1, y: 1 }, 100, 80, 120, 90)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("clamps cursor percentages", () => {
    expect(computeLensPosition({ x: -4, y: 5 }, 100, 100, 20, 20)).toEqual({
      x: 0,
      y: 80,
    });
  });
});

describe("computeMagnifiedTranslate", () => {
  it("centers the magnified point and clamps every edge", () => {
    expect(computeMagnifiedTranslate({ x: 0, y: 0 }, 100, 80, 2, 40, 40)).toEqual({ x: 0, y: 0 });
    expect(computeMagnifiedTranslate({ x: 0.5, y: 0.5 }, 100, 80, 2, 40, 40)).toEqual({
      x: -80,
      y: -60,
    });
    expect(computeMagnifiedTranslate({ x: 1, y: 1 }, 100, 80, 2, 40, 40)).toEqual({
      x: -160,
      y: -120,
    });
  });

  it("supports a viewport equal to the scaled image", () => {
    expect(computeMagnifiedTranslate({ x: 0.8, y: 0.2 }, 100, 50, 2, 200, 100)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("centers a scaled image smaller than its viewport on each axis", () => {
    expect(computeMagnifiedTranslate({ x: 1, y: 0 }, 100, 50, 1, 140, 80)).toEqual({
      x: 20,
      y: 15,
    });
  });
});

describe("computeTrackerRect", () => {
  it("derives panel dimensions in source coordinates", () => {
    expect(computeTrackerRect({ x: 0.5, y: 0.5 }, 500, 400, 2, 200, 100)).toEqual({
      x: 200,
      y: 175,
      width: 100,
      height: 50,
    });
  });

  it("clamps to all edges and never exceeds the source", () => {
    expect(computeTrackerRect({ x: 0, y: 0 }, 100, 80, 2, 40, 40)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    });
    expect(computeTrackerRect({ x: 1, y: 1 }, 100, 80, 2, 40, 40)).toEqual({
      x: 80,
      y: 60,
      width: 20,
      height: 20,
    });
    expect(computeTrackerRect({ x: 0.5, y: 0.5 }, 100, 80, 1, 200, 200)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });
  });
});

describe("numeric validation", () => {
  const invalidDimensions = [0, -1, Number.NaN, Infinity, -Infinity];

  it.each(invalidDimensions)("rejects invalid dimensions: %s", (value) => {
    expect(() => computeLensPosition({ x: 0.5, y: 0.5 }, value, 10, 2, 2)).toThrow(RangeError);
    expect(() => computeMagnifiedTranslate({ x: 0.5, y: 0.5 }, 10, 10, 2, value, 2)).toThrow(
      RangeError,
    );
    expect(() => computeTrackerRect({ x: 0.5, y: 0.5 }, 10, 10, 2, 2, value)).toThrow(RangeError);
  });

  it.each([0, 0.99, Number.NaN, Infinity, -Infinity])("rejects invalid zoom: %s", (zoom) => {
    expect(() => computeMagnifiedTranslate({ x: 0.5, y: 0.5 }, 10, 10, zoom, 2, 2)).toThrow(
      RangeError,
    );
    expect(() => computeTrackerRect({ x: 0.5, y: 0.5 }, 10, 10, zoom, 2, 2)).toThrow(RangeError);
  });

  it("rejects non-finite cursor values", () => {
    expect(() => computeLensPosition({ x: Number.NaN, y: 0 }, 10, 10, 2, 2)).toThrow(RangeError);
  });
});
