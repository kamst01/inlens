import type { CursorPct, MagnifierController, MagnifierControllerOptions } from "./types";

const INITIAL_CURSOR: CursorPct = Object.freeze({ x: 0.5, y: 0.5 });

function normalizeCursorCoordinate(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Creates the single pointer, scroll, and animation-frame controller shared by
 * every visual surface in one magnifier root.
 *
 * Construction reads no browser globals: the required mounted container
 * supplies its own document and window realm.
 *
 * @throws {TypeError} When `container` is not a mounted-realm `HTMLElement`.
 */
export function createMagnifierController(
  options: MagnifierControllerOptions,
): MagnifierController {
  const { container } = options;

  const view = container?.ownerDocument?.defaultView;
  if (!view || !(container instanceof view.HTMLElement)) {
    throw new TypeError("container must be a real HTMLElement with an active window realm");
  }

  let active = false;
  let disabled = options.disabled ?? false;
  let destroyed = false;
  let cursor = INITIAL_CURSOR;
  let clientX = 0;
  let clientY = 0;
  let frameId: number | null = null;
  let scrollAttached = false;

  const cursorListeners = new Set<(snapshot: CursorPct) => void>();
  const activeListeners = new Set<(nextActive: boolean) => void>();

  const readCursor = (): CursorPct => {
    const rect = container.getBoundingClientRect();
    const nextX =
      Number.isFinite(rect.width) && rect.width > 0
        ? normalizeCursorCoordinate((clientX - rect.left) / rect.width)
        : cursor.x;
    const nextY =
      Number.isFinite(rect.height) && rect.height > 0
        ? normalizeCursorCoordinate((clientY - rect.top) / rect.height)
        : cursor.y;
    return Object.freeze({ x: nextX, y: nextY });
  };

  const publishCursor = (): void => {
    frameId = null;
    if (!active || destroyed) return;
    cursor = readCursor();
    for (const listener of [...cursorListeners]) listener(cursor);
  };

  const scheduleCursor = (): void => {
    if (frameId !== null || !active || destroyed) return;
    frameId = view.requestAnimationFrame(publishCursor);
  };

  const handleScroll = (): void => {
    scheduleCursor();
  };

  const attachScroll = (): void => {
    if (scrollAttached) return;
    view.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    scrollAttached = true;
  };

  const detachScroll = (): void => {
    if (!scrollAttached) return;
    view.removeEventListener("scroll", handleScroll, true);
    scrollAttached = false;
  };

  const cancelFrame = (): void => {
    if (frameId === null) return;
    view.cancelAnimationFrame(frameId);
    frameId = null;
  };

  const notifyActive = (nextActive: boolean): void => {
    for (const listener of [...activeListeners]) listener(nextActive);
  };

  const deactivate = (): void => {
    cancelFrame();
    detachScroll();
    if (!active) return;
    active = false;
    notifyActive(false);
  };

  const isEligible = (event: PointerEvent): boolean => event.pointerType !== "touch";

  const handlePointerEnter = (event: PointerEvent): void => {
    if (destroyed || disabled || !isEligible(event)) return;
    clientX = event.clientX;
    clientY = event.clientY;
    cursor = readCursor();
    if (active) return;
    active = true;
    attachScroll();
    notifyActive(true);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!active || destroyed || !isEligible(event)) return;
    clientX = event.clientX;
    clientY = event.clientY;
    scheduleCursor();
  };

  const handlePointerExit = (): void => {
    if (destroyed) return;
    deactivate();
  };

  container.addEventListener("pointerenter", handlePointerEnter);
  container.addEventListener("pointermove", handlePointerMove);
  container.addEventListener("pointerleave", handlePointerExit);
  container.addEventListener("pointercancel", handlePointerExit);

  const subscribeTo = <T>(set: Set<T>, listener: T): (() => void) => {
    if (destroyed) return () => undefined;
    set.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      set.delete(listener);
    };
  };

  return {
    containerEl: container,
    isActive: () => active,
    getCursorPct: () => cursor,
    subscribe: (listener) => subscribeTo(cursorListeners, listener),
    onActiveChange: (listener) => subscribeTo(activeListeners, listener),
    setDisabled(nextDisabled) {
      if (destroyed || disabled === nextDisabled) return;
      disabled = nextDisabled;
      if (disabled) deactivate();
    },
    destroy() {
      if (destroyed) return;
      deactivate();
      destroyed = true;
      container.removeEventListener("pointerenter", handlePointerEnter);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerExit);
      container.removeEventListener("pointercancel", handlePointerExit);
      cursorListeners.clear();
      activeListeners.clear();
    },
  };
}
