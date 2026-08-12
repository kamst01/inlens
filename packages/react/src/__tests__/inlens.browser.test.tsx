import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { describe, expect, it } from "vitest";
import { InLens } from "../index";

function getSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-inlens-slot="${slot}"]`);
  if (!element) throw new Error(`Expected an InLens ${slot} slot.`);
  return element;
}

function getSlots(slot: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`[data-inlens-slot="${slot}"]`)];
}

function property(element: HTMLElement, name: string): string {
  return element.style.getPropertyValue(name);
}

function numberProperty(element: HTMLElement, name: string): number {
  return Number.parseFloat(property(element, name));
}

function movePointer(
  root: HTMLElement,
  x: number,
  y: number,
  type: "pointerenter" | "pointermove" = "pointerenter",
  pointerType = "mouse",
): void {
  const bounds = root.getBoundingClientRect();
  root.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: bounds.left + x,
      clientY: bounds.top + y,
      pointerType,
    }),
  );
}

describe("InLens in a real browser", () => {
  it("measures and activates a compound composition without an application host", async () => {
    await render(
      <InLens.Root zoom={2} style={{ position: "relative", width: 500, height: 400 }}>
        <InLens.Image>
          <div style={{ width: "100%", height: "100%" }} />
        </InLens.Image>
        <InLens.Lens style={{ position: "absolute", width: 100, height: 80 }}>
          <InLens.Magnified>
            <div />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker style={{ position: "absolute" }} />
        <InLens.Panel style={{ width: 200, height: 160 }}>
          <InLens.Magnified>
            <div />
          </InLens.Magnified>
        </InLens.Panel>
      </InLens.Root>,
    );

    const root = getSlot("root");
    const lens = getSlot("lens");
    const tracker = getSlot("tracker");
    const panel = getSlot("panel");
    const magnified = getSlots("magnified");

    await expect.poll(() => property(root, "--inlens-root-width")).toBe("500px");
    await page.elementLocator(root).hover({ position: { x: 250, y: 200 } });

    await expect.poll(() => root.dataset.inlensState).toBe("active");
    expect(property(root, "--inlens-root-height")).toBe("400px");
    expect(property(root, "--inlens-zoom")).toBe("2");
    expect(numberProperty(lens, "--inlens-x")).toBeCloseTo(200, 1);
    expect(numberProperty(lens, "--inlens-y")).toBeCloseTo(160, 1);
    expect(numberProperty(tracker, "--inlens-x")).toBeCloseTo(200, 1);
    expect(numberProperty(tracker, "--inlens-y")).toBeCloseTo(160, 1);
    expect(property(tracker, "--inlens-width")).toBe("100px");
    expect(property(tracker, "--inlens-height")).toBe("80px");
    expect(numberProperty(magnified[0]!, "--inlens-x")).toBeCloseTo(-450, 1);
    expect(numberProperty(magnified[0]!, "--inlens-y")).toBeCloseTo(-360, 1);
    expect(numberProperty(magnified[1]!, "--inlens-x")).toBeCloseTo(-400, 1);
    expect(numberProperty(magnified[1]!, "--inlens-y")).toBeCloseTo(-320, 1);
    expect(panel.style.width).toBe("200px");
    expect(panel.style.height).toBe("160px");
  });

  it("responds to consumer CSS resizing the observed surfaces", async () => {
    await render(
      <InLens.Root zoom={2} style={{ position: "relative", width: 400, height: 300 }}>
        <InLens.Lens style={{ position: "absolute", width: 80, height: 60 }}>
          <InLens.Magnified>
            <span />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker />
        <InLens.Panel style={{ width: 200, height: 120 }}>
          <span />
        </InLens.Panel>
      </InLens.Root>,
    );

    const root = getSlot("root");
    const lens = getSlot("lens");
    const panel = getSlot("panel");
    const tracker = getSlot("tracker");
    await expect.poll(() => property(root, "--inlens-root-width")).toBe("400px");
    movePointer(root, 200, 150);
    await expect.poll(() => property(lens, "--inlens-x")).toBe("160px");

    root.style.width = "600px";
    root.style.height = "400px";
    lens.style.width = "120px";
    lens.style.height = "100px";
    panel.style.width = "300px";
    panel.style.height = "180px";

    await expect.poll(() => property(root, "--inlens-root-width")).toBe("600px");
    await expect.poll(() => property(lens, "--inlens-x")).toBe("240px");
    expect(property(lens, "--inlens-y")).toBe("150px");
    expect(property(tracker, "--inlens-x")).toBe("225px");
    expect(property(tracker, "--inlens-y")).toBe("155px");
    expect(property(tracker, "--inlens-width")).toBe("150px");
    expect(property(tracker, "--inlens-height")).toBe("90px");
  });

  it("uses the first Panel for Tracker geometry and clamps at both edges", async () => {
    await render(
      <InLens.Root zoom={2} style={{ position: "relative", width: 400, height: 300 }}>
        <InLens.Tracker />
        <InLens.Panel style={{ width: 200, height: 100 }}>
          <span />
        </InLens.Panel>
        <InLens.Panel style={{ width: 100, height: 200 }}>
          <span />
        </InLens.Panel>
      </InLens.Root>,
    );

    const root = getSlot("root");
    const tracker = getSlot("tracker");
    await expect.poll(() => property(root, "--inlens-root-width")).toBe("400px");

    const rootLocator = page.elementLocator(root);
    await rootLocator.hover({ position: { x: 1, y: 1 } });
    await expect.poll(() => numberProperty(tracker, "--inlens-x")).toBeCloseTo(0, 1);
    expect(numberProperty(tracker, "--inlens-y")).toBeCloseTo(0, 1);
    expect(property(tracker, "--inlens-width")).toBe("100px");
    expect(property(tracker, "--inlens-height")).toBe("50px");

    await rootLocator.hover({ position: { x: 399, y: 299 } });
    await expect.poll(() => numberProperty(tracker, "--inlens-x")).toBeCloseTo(300, 1);
    expect(numberProperty(tracker, "--inlens-y")).toBeCloseTo(250, 1);
  });

  it("ignores touch pointers while preserving mouse behavior", async () => {
    await render(
      <InLens.Root style={{ position: "relative", width: 200, height: 200 }}>
        <InLens.Lens style={{ position: "absolute", width: 40, height: 40 }}>
          <span />
        </InLens.Lens>
      </InLens.Root>,
    );

    const root = getSlot("root");
    await expect.poll(() => property(root, "--inlens-root-width")).toBe("200px");
    movePointer(root, 100, 100, "pointerenter", "touch");
    expect(root.dataset.inlensState).toBe("idle");

    movePointer(root, 100, 100);
    await expect.poll(() => root.dataset.inlensState).toBe("active");
  });
});
