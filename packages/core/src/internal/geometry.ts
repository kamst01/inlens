import type { CursorPct } from "../types";

interface Position {
  x: number;
  y: number;
}

interface TrackerRect extends Position {
  width: number;
  height: number;
}

/** @internal Inputs must already satisfy the public geometry contract. */
export function clampUnchecked(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** @internal Inputs must already satisfy the public geometry contract. */
export function computeLensPositionUnchecked(
  cursor: CursorPct,
  rootWidth: number,
  rootHeight: number,
  lensWidth: number,
  lensHeight: number,
): Position {
  return {
    x: clampUnchecked(cursor.x * rootWidth - lensWidth / 2, 0, Math.max(0, rootWidth - lensWidth)),
    y: clampUnchecked(
      cursor.y * rootHeight - lensHeight / 2,
      0,
      Math.max(0, rootHeight - lensHeight),
    ),
  };
}

/** @internal Inputs must already satisfy the public geometry contract. */
export function computeMagnifiedTranslateUnchecked(
  cursor: CursorPct,
  sourceWidth: number,
  sourceHeight: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
): Position {
  const scaledWidth = sourceWidth * zoom;
  const scaledHeight = sourceHeight * zoom;

  return {
    x:
      viewportWidth >= scaledWidth
        ? (viewportWidth - scaledWidth) / 2
        : clampUnchecked(
            viewportWidth / 2 - cursor.x * scaledWidth,
            viewportWidth - scaledWidth,
            0,
          ),
    y:
      viewportHeight >= scaledHeight
        ? (viewportHeight - scaledHeight) / 2
        : clampUnchecked(
            viewportHeight / 2 - cursor.y * scaledHeight,
            viewportHeight - scaledHeight,
            0,
          ),
  };
}

/** @internal Inputs must already satisfy the public geometry contract. */
export function computeTrackerRectUnchecked(
  cursor: CursorPct,
  sourceWidth: number,
  sourceHeight: number,
  zoom: number,
  panelWidth: number,
  panelHeight: number,
): TrackerRect {
  const width = Math.min(sourceWidth, panelWidth / zoom);
  const height = Math.min(sourceHeight, panelHeight / zoom);

  return {
    x: clampUnchecked(cursor.x * sourceWidth - width / 2, 0, sourceWidth - width),
    y: clampUnchecked(cursor.y * sourceHeight - height / 2, 0, sourceHeight - height),
    width,
    height,
  };
}
