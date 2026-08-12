import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMagnifierController } from "../index";

let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;

function flushFrame(time = 16): void {
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(time);
}

function pointer(element: HTMLElement, type: string, init: PointerEventInit = {}): void {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: false,
      clientX: 0,
      clientY: 0,
      pointerType: "mouse",
      ...init,
    }),
  );
}

function surface() {
  const element = document.createElement("div");
  document.body.append(element);
  const measure = vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 10,
    y: 20,
    left: 10,
    top: 20,
    right: 210,
    bottom: 120,
    width: 200,
    height: 100,
    toJSON: () => ({}),
  });
  return { element, measure };
}

beforeEach(() => {
  nextFrameId = 1;
  frames = new Map();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
});

afterEach(() => {
  for (const element of document.querySelectorAll<HTMLElement>("div")) {
    pointer(element, "pointerleave");
  }
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("createMagnifierController", () => {
  it("starts inactive with a centered snapshot", () => {
    const { element } = surface();
    const controller = createMagnifierController({ container: element });
    expect(controller.isActive()).toBe(false);
    expect(controller.getCursorPct()).toEqual({ x: 0.5, y: 0.5 });
  });

  it("measures synchronously before eligible activation is notified", () => {
    const { element, measure } = surface();
    const controller = createMagnifierController({ container: element });
    const seen: Array<{ active: boolean; cursor: { x: number; y: number } }> = [];
    controller.onActiveChange((active) => seen.push({ active, cursor: controller.getCursorPct() }));

    pointer(element, "pointerenter", {
      clientX: 60,
      clientY: 45,
      pointerType: "pen",
    });

    expect(measure).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([{ active: true, cursor: { x: 0.25, y: 0.25 } }]);
  });

  it("suppresses touch but permits mouse on hybrid/coarse-primary devices", () => {
    const { element } = surface();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    const controller = createMagnifierController({ container: element });

    pointer(element, "pointerenter", {
      pointerType: "touch",
      clientX: 20,
      clientY: 30,
    });
    expect(controller.isActive()).toBe(false);

    pointer(element, "pointerenter", {
      pointerType: "mouse",
      clientX: 20,
      clientY: 30,
    });
    expect(controller.isActive()).toBe(true);
  });

  it("keeps one RAF pending and publishes the latest coordinates with one measurement", () => {
    const { element, measure } = surface();
    const controller = createMagnifierController({ container: element });
    const listener = vi.fn();
    controller.subscribe(listener);
    pointer(element, "pointerenter", { clientX: 20, clientY: 30 });
    measure.mockClear();

    pointer(element, "pointermove", { clientX: 30, clientY: 40 });
    pointer(element, "pointermove", { clientX: 110, clientY: 70 });
    pointer(element, "pointermove", { clientX: 190, clientY: 100 });

    expect(frames.size).toBe(1);
    flushFrame();
    expect(measure).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({ x: 0.9, y: 0.8 });
  });

  it("resynchronizes captured scroll only while active", () => {
    const { element, measure } = surface();
    const controller = createMagnifierController({ container: element });
    const listener = vi.fn();
    controller.subscribe(listener);

    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(0);

    pointer(element, "pointerenter", { clientX: 110, clientY: 70 });
    measure.mockReturnValue({
      x: 10,
      y: 0,
      left: 10,
      top: 0,
      right: 210,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    });
    window.dispatchEvent(new Event("scroll"));
    flushFrame();
    expect(listener).toHaveBeenLastCalledWith({ x: 0.5, y: 0.7 });

    pointer(element, "pointerleave");
    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(0);
  });

  it.each(["pointerleave", "pointercancel"])("deactivates once on %s", (eventName) => {
    const { element } = surface();
    const controller = createMagnifierController({ container: element });
    const listener = vi.fn();
    controller.onActiveChange(listener);
    pointer(element, "pointerenter");
    pointer(element, eventName);
    pointer(element, eventName);
    expect(listener.mock.calls).toEqual([[true], [false]]);
    expect(controller.isActive()).toBe(false);
  });

  it("disabling while active cancels RAF and emits one deactivation", () => {
    const { element } = surface();
    const controller = createMagnifierController({ container: element });
    const listener = vi.fn();
    controller.onActiveChange(listener);
    pointer(element, "pointerenter");
    pointer(element, "pointermove", { clientX: 20 });
    expect(frames.size).toBe(1);

    controller.setDisabled(true);
    controller.setDisabled(true);
    expect(frames.size).toBe(0);
    expect(window.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls).toEqual([[true], [false]]);

    pointer(element, "pointerenter");
    expect(controller.isActive()).toBe(false);
    controller.setDisabled(false);
    pointer(element, "pointerenter");
    expect(controller.isActive()).toBe(true);
  });

  it("uses snapshot iteration and supports idempotent unsubscription", () => {
    const { element } = surface();
    const controller = createMagnifierController({ container: element });
    const first = vi.fn();
    let unsubscribeFirst: () => void = () => undefined;
    unsubscribeFirst = controller.subscribe((cursor) => {
      first(cursor);
      unsubscribeFirst();
      unsubscribeFirst();
    });
    const second = vi.fn();
    controller.subscribe(second);
    pointer(element, "pointerenter");

    pointer(element, "pointermove", { clientX: 30, clientY: 40 });
    flushFrame();
    pointer(element, "pointermove", { clientX: 40, clientY: 50 });
    flushFrame();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it("destroys idempotently, cancels work, clears subscribers, and makes events inert", () => {
    const { element } = surface();
    const removeElementListener = vi.spyOn(element, "removeEventListener");
    const controller = createMagnifierController({ container: element });
    const cursorListener = vi.fn();
    const activeListener = vi.fn();
    controller.subscribe(cursorListener);
    controller.onActiveChange(activeListener);
    pointer(element, "pointerenter");
    pointer(element, "pointermove");

    controller.destroy();
    controller.destroy();
    controller.setDisabled(false);
    expect(frames.size).toBe(0);
    expect(removeElementListener).toHaveBeenCalledTimes(4);
    expect(activeListener.mock.calls).toEqual([[true], [false]]);

    pointer(element, "pointerenter");
    window.dispatchEvent(new Event("scroll"));
    flushFrame();
    expect(controller.isActive()).toBe(false);
    expect(cursorListener).not.toHaveBeenCalled();
  });

  it("is safe to import without browser globals", async () => {
    vi.resetModules();
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    await expect(import("../index")).resolves.toBeDefined();
    vi.unstubAllGlobals();
  });
});
