import "@testing-library/jest-dom/vitest";

if (!("PointerEvent" in globalThis)) {
  class TestPointerEvent extends MouseEvent {
    readonly pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "";
    }
  }

  Object.defineProperty(globalThis, "PointerEvent", {
    configurable: true,
    value: TestPointerEvent,
  });
}
