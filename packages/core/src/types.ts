/**
 * A pointer position normalized to the source surface.
 *
 * @remarks
 * Snapshots returned by a {@link MagnifierController} are immutable and clamped
 * to the inclusive range from `0` to `1` on each axis.
 */
export interface CursorPct {
  /** The horizontal position, where `0` is the left edge and `1` is the right edge. */
  x: number;
  /** The vertical position, where `0` is the top edge and `1` is the bottom edge. */
  y: number;
}

/**
 * Controls pointer tracking for one magnifier source without depending on a UI framework.
 *
 * @remarks
 * The controller ignores touch pointers, publishes pointer movement at most once per
 * animation frame, and observes captured scroll events while active so its cursor snapshot
 * stays aligned with the source element.
 */
export interface MagnifierController {
  /** The source element whose pointer events and bounding rectangle are observed. */
  readonly containerEl: HTMLElement;

  /**
   * Reports whether an eligible pointer is currently over the source surface.
   *
   * @returns `true` while a non-touch pointer is active and the controller is enabled.
   */
  isActive(): boolean;
  /**
   * Reads the most recently published cursor position.
   *
   * @returns An immutable, normalized cursor snapshot. Before the first eligible pointer
   * interaction, both axes are `0.5`.
   */
  getCursorPct(): CursorPct;

  /**
   * Subscribes to animation-frame-throttled cursor updates.
   *
   * @remarks
   * The listener is not called immediately. Read {@link MagnifierController.getCursorPct}
   * when an initial snapshot is needed.
   *
   * @param listener - Receives each newly published immutable cursor snapshot.
   * @returns An idempotent function that removes the listener.
   */
  subscribe(listener: (cursor: CursorPct) => void): () => void;
  /**
   * Subscribes to activation changes for the current pointer session.
   *
   * @param listener - Receives `true` on activation and `false` on deactivation.
   * @returns An idempotent function that removes the listener.
   */
  onActiveChange(listener: (active: boolean) => void): () => void;

  /**
   * Enables or disables pointer behavior without replacing the controller.
   *
   * @remarks
   * Disabling an active controller immediately deactivates it. Re-enabling waits for the
   * next eligible pointer entry before activating again.
   *
   * @param disabled - Whether pointer tracking should be disabled.
   */
  setDisabled(disabled: boolean): void;
  /**
   * Removes DOM and subscriber listeners and makes the controller permanently inert.
   *
   * @remarks
   * Calling this method more than once has no effect.
   */
  destroy(): void;
}

/**
 * Options for {@link createMagnifierController}.
 */
export interface MagnifierControllerOptions {
  /**
   * The source element that receives pointer listeners.
   *
   * The element must belong to a document with an active window realm.
   *
   * @remarks
   * Geometry and zoom are intentionally not controller options; the controller owns pointer
   * behavior only.
   */
  container: HTMLElement;
  /**
   * Whether pointer tracking starts disabled.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
}
