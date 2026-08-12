import type { CursorPct } from "./types";
import {
  clampUnchecked,
  computeLensPositionUnchecked,
  computeMagnifiedTranslateUnchecked,
  computeTrackerRectUnchecked,
} from "./internal/geometry";

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite; received ${String(value)}`);
  }
}

function assertDimension(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be greater than zero; received ${value}`);
  }
}

function assertZoom(zoom: number): void {
  assertFinite(zoom, "zoom");
  if (zoom < 1) {
    throw new RangeError(`zoom must be at least 1; received ${zoom}`);
  }
}

function normalizedCursor(cursor: CursorPct): CursorPct {
  assertFinite(cursor.x, "cursor.x");
  assertFinite(cursor.y, "cursor.y");
  return {
    x: clamp(cursor.x, 0, 1),
    y: clamp(cursor.y, 0, 1),
  };
}

/**
 * Clamps a finite number to an inclusive finite range.
 *
 * @throws {RangeError} When an input is non-finite or `min` exceeds `max`.
 */
export function clamp(value: number, min: number, max: number): number {
  assertFinite(value, "value");
  assertFinite(min, "min");
  assertFinite(max, "max");
  if (min > max) {
    throw new RangeError(`min must be less than or equal to max; received ${min} > ${max}`);
  }
  return clampUnchecked(value, min, max);
}

/**
 * Computes a lens's clamped top-left translation in logical source coordinates.
 */
export function computeLensPosition(
  cursor: CursorPct,
  rootWidth: number,
  rootHeight: number,
  lensWidth: number,
  lensHeight: number,
): { x: number; y: number } {
  const point = normalizedCursor(cursor);
  assertDimension(rootWidth, "rootWidth");
  assertDimension(rootHeight, "rootHeight");
  assertDimension(lensWidth, "lensWidth");
  assertDimension(lensHeight, "lensHeight");

  return computeLensPositionUnchecked(point, rootWidth, rootHeight, lensWidth, lensHeight);
}

/**
 * Computes the clamped translation for a consumer-sized magnified surface.
 * A scaled surface smaller than its viewport is centered on that axis.
 */
export function computeMagnifiedTranslate(
  cursor: CursorPct,
  sourceWidth: number,
  sourceHeight: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const point = normalizedCursor(cursor);
  assertDimension(sourceWidth, "sourceWidth");
  assertDimension(sourceHeight, "sourceHeight");
  assertZoom(zoom);
  assertDimension(viewportWidth, "viewportWidth");
  assertDimension(viewportHeight, "viewportHeight");

  const scaledWidth = sourceWidth * zoom;
  const scaledHeight = sourceHeight * zoom;
  assertFinite(scaledWidth, "scaledWidth");
  assertFinite(scaledHeight, "scaledHeight");

  return computeMagnifiedTranslateUnchecked(
    point,
    sourceWidth,
    sourceHeight,
    zoom,
    viewportWidth,
    viewportHeight,
  );
}

/** Computes the source-coordinate rectangle represented by an external panel. */
export function computeTrackerRect(
  cursor: CursorPct,
  sourceWidth: number,
  sourceHeight: number,
  zoom: number,
  panelWidth: number,
  panelHeight: number,
): { x: number; y: number; width: number; height: number } {
  const point = normalizedCursor(cursor);
  assertDimension(sourceWidth, "sourceWidth");
  assertDimension(sourceHeight, "sourceHeight");
  assertZoom(zoom);
  assertDimension(panelWidth, "panelWidth");
  assertDimension(panelHeight, "panelHeight");

  return computeTrackerRectUnchecked(
    point,
    sourceWidth,
    sourceHeight,
    zoom,
    panelWidth,
    panelHeight,
  );
}
