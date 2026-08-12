"use client";

import { createElement, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { createMagnifierController } from "@inlens/core";
import type { CursorPct, MagnifierController } from "@inlens/core";
import {
  computeLensPositionUnchecked,
  computeMagnifiedTranslateUnchecked,
  computeTrackerRectUnchecked,
} from "@inlens/core/internal/geometry";

const ROOT_SELECTOR = '[data-inlens-slot="root"]';
const SLOT_SELECTOR = "[data-inlens-slot]";
const VIEWPORT_SELECTOR = '[data-inlens-slot="lens"], [data-inlens-slot="panel"]';

type RootElement = "div" | "figure";

interface RuntimeProps {
  zoom: number;
  disabled: boolean;
  as: RootElement;
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

interface Size {
  width: number;
  height: number;
}

interface Slots {
  lenses: HTMLElement[];
  panels: HTMLElement[];
  trackers: HTMLElement[];
  magnified: Map<HTMLElement, HTMLElement>;
}

const EMPTY_SLOTS: Slots = {
  lenses: [],
  panels: [],
  trackers: [],
  magnified: new Map(),
};

function pixels(value: number): string {
  return `${Object.is(value, -0) ? 0 : value}px`;
}

function positive(size: Size | undefined): Size | null {
  if (
    !size ||
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    return null;
  }
  return size;
}

function readBorderBox(entry: ResizeObserverEntry): Size {
  const boxSizes = entry.borderBoxSize as unknown as
    | ResizeObserverSize
    | readonly ResizeObserverSize[];
  const box = Array.isArray(boxSizes) ? boxSizes[0] : (boxSizes as ResizeObserverSize);
  if (box && Number.isFinite(box.inlineSize) && Number.isFinite(box.blockSize)) {
    return { width: box.inlineSize, height: box.blockSize };
  }
  const rect = entry.target.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function belongsTo(root: HTMLElement, element: HTMLElement): boolean {
  return element.closest(ROOT_SELECTOR) === root;
}

function setPosition(element: HTMLElement, x: number, y: number): void {
  element.style.setProperty("--inlens-x", pixels(x));
  element.style.setProperty("--inlens-y", pixels(y));
}

function clearPosition(element: HTMLElement): void {
  element.style.removeProperty("--inlens-x");
  element.style.removeProperty("--inlens-y");
}

function clearTracker(element: HTMLElement): void {
  clearPosition(element);
  element.style.removeProperty("--inlens-width");
  element.style.removeProperty("--inlens-height");
}

/** @internal The only client boundary in the public InLens compound tree. */
export function Runtime({
  zoom,
  disabled,
  as,
  children,
  className,
  style,
}: RuntimeProps): ReactElement {
  const rootRef = useRef<HTMLElement | null>(null);
  const cursorRef = useRef<CursorPct>({ x: 0.5, y: 0.5 });
  const zoomRef = useRef(zoom);
  const disabledRef = useRef(disabled);
  const publishRef = useRef<((cursor: CursorPct) => void) | null>(null);
  const [compositionError, setCompositionError] = useState<Error | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const view = root?.ownerDocument.defaultView;
    if (!root || !view) return;

    const ResizeObserverConstructor = view.ResizeObserver;
    const MutationObserverConstructor = view.MutationObserver;
    if (!ResizeObserverConstructor || !MutationObserverConstructor) {
      setCompositionError(new Error("InLens requires ResizeObserver and MutationObserver."));
      return;
    }

    let slots = EMPTY_SLOTS;
    const sizes = new Map<HTMLElement, Size>();
    cursorRef.current = { x: 0.5, y: 0.5 };
    const observed = new Set<HTMLElement>();
    let controller: MagnifierController;
    let failed = false;

    const fail = (message: string): void => {
      if (failed) return;
      failed = true;
      setCompositionError(new Error(message));
    };

    const publish = (cursor: CursorPct): void => {
      cursorRef.current = cursor;
      const rootSize = positive(sizes.get(root));
      const ready = Boolean(
        rootSize &&
        slots.lenses.every((element) => positive(sizes.get(element)) !== null) &&
        slots.panels.every((element) => positive(sizes.get(element)) !== null),
      );

      controller.setDisabled(disabledRef.current || !ready);
      if (!rootSize || !ready) {
        root.dataset.inlensState = "idle";
        for (const lens of slots.lenses) clearPosition(lens);
        for (const magnified of slots.magnified.keys()) clearPosition(magnified);
        for (const tracker of slots.trackers) clearTracker(tracker);
        return;
      }

      const lensWrites: Array<[HTMLElement, number, number]> = [];
      const magnifiedWrites: Array<[HTMLElement, number, number]> = [];
      const trackerWrites: Array<[HTMLElement, number, number, number, number]> = [];
      const positionClears: HTMLElement[] = [];
      const trackerClears: HTMLElement[] = [];

      for (const lens of slots.lenses) {
        const lensSize = positive(sizes.get(lens));
        if (!lensSize) {
          positionClears.push(lens);
          continue;
        }
        const position = computeLensPositionUnchecked(
          cursor,
          rootSize.width,
          rootSize.height,
          lensSize.width,
          lensSize.height,
        );
        lensWrites.push([lens, position.x, position.y]);
      }

      for (const [magnified, viewport] of slots.magnified) {
        const viewportSize = positive(sizes.get(viewport));
        if (!viewportSize) {
          positionClears.push(magnified);
          continue;
        }
        const position = computeMagnifiedTranslateUnchecked(
          cursor,
          rootSize.width,
          rootSize.height,
          zoomRef.current,
          viewportSize.width,
          viewportSize.height,
        );
        magnifiedWrites.push([magnified, position.x, position.y]);
      }

      const panel = slots.panels[0];
      const panelSize = panel ? positive(sizes.get(panel)) : null;
      if (panelSize) {
        const rect = computeTrackerRectUnchecked(
          cursor,
          rootSize.width,
          rootSize.height,
          zoomRef.current,
          panelSize.width,
          panelSize.height,
        );
        for (const tracker of slots.trackers) {
          trackerWrites.push([tracker, rect.x, rect.y, rect.width, rect.height]);
        }
      } else {
        trackerClears.push(...slots.trackers);
      }

      for (const element of positionClears) clearPosition(element);
      for (const element of trackerClears) clearTracker(element);
      for (const [element, x, y] of lensWrites) setPosition(element, x, y);
      for (const [element, x, y] of magnifiedWrites) setPosition(element, x, y);
      for (const [element, x, y, width, height] of trackerWrites) {
        setPosition(element, x, y);
        element.style.setProperty("--inlens-width", pixels(width));
        element.style.setProperty("--inlens-height", pixels(height));
      }
    };

    const resizeObserver = new ResizeObserverConstructor((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const size = readBorderBox(entry);
        sizes.set(element, size);
        if (element === root) {
          root.style.setProperty("--inlens-root-width", pixels(size.width));
          root.style.setProperty("--inlens-root-height", pixels(size.height));
        }
      }
      publish(cursorRef.current);
    });

    const observe = (elements: Set<HTMLElement>): void => {
      for (const element of observed) {
        if (element !== root && !elements.has(element)) {
          resizeObserver.unobserve(element);
          observed.delete(element);
          sizes.delete(element);
        }
      }
      for (const element of elements) {
        if (observed.has(element)) continue;
        observed.add(element);
        resizeObserver.observe(element, { box: "border-box" });
      }
    };

    const scan = (): void => {
      const lenses: HTMLElement[] = [];
      const panels: HTMLElement[] = [];
      const trackers: HTMLElement[] = [];
      const magnifiedElements: HTMLElement[] = [];
      for (const element of root.querySelectorAll<HTMLElement>(SLOT_SELECTOR)) {
        if (!belongsTo(root, element)) continue;
        switch (element.dataset.inlensSlot) {
          case "lens":
            lenses.push(element);
            break;
          case "panel":
            panels.push(element);
            break;
          case "tracker":
            trackers.push(element);
            break;
          case "magnified":
            magnifiedElements.push(element);
            break;
        }
      }

      if (trackers.length > 0 && panels.length === 0) {
        fail("<InLens.Tracker> requires a <InLens.Panel> in the same Root.");
        return;
      }

      const magnified = new Map<HTMLElement, HTMLElement>();
      for (const element of magnifiedElements) {
        const viewport = element.closest<HTMLElement>(VIEWPORT_SELECTOR);
        if (!viewport || !belongsTo(root, viewport)) {
          fail("<InLens.Magnified> requires a <InLens.Lens> or <InLens.Panel> in the same Root.");
          return;
        }
        magnified.set(element, viewport);
      }

      slots = { lenses, panels, trackers, magnified };
      observe(new Set([root, ...lenses, ...panels]));
      publish(cursorRef.current);
    };

    publishRef.current = publish;
    controller = createMagnifierController({ container: root, disabled: true });
    const unsubscribeCursor = controller.subscribe(publish);
    const unsubscribeActive = controller.onActiveChange((active) => {
      root.dataset.inlensState = active ? "active" : "idle";
      if (active) publish(controller.getCursorPct());
    });

    root.style.setProperty("--inlens-zoom", String(zoomRef.current));
    root.dataset.inlensState = "idle";
    observed.add(root);
    resizeObserver.observe(root, { box: "border-box" });

    const mutationObserver = new MutationObserverConstructor(scan);
    mutationObserver.observe(root, { childList: true, subtree: true });
    scan();

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      unsubscribeCursor();
      unsubscribeActive();
      controller.destroy();
      publishRef.current = null;
      sizes.clear();
      root.dataset.inlensState = "idle";
    };
  }, [as]);

  useEffect(() => {
    zoomRef.current = zoom;
    disabledRef.current = disabled;
    rootRef.current?.style.setProperty("--inlens-zoom", String(zoom));
    publishRef.current?.(cursorRef.current);
  }, [disabled, zoom]);

  if (compositionError) throw compositionError;

  return createElement(
    as,
    {
      ref: rootRef,
      className,
      style,
      "data-inlens-slot": "root",
      "data-inlens-state": "idle",
    },
    children,
  );
}
