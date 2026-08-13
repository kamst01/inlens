import { Component, createRef } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InLens } from "../index";

let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;
let resizeObservers: TestResizeObserver[];

class TestResizeObserver implements ResizeObserver {
  readonly observed = new Set<Element>();

  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObservers.push(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }

  emit(target: Element, width: number, height: number): void {
    if (!this.observed.has(target)) return;
    this.callback(
      [
        {
          target,
          borderBoxSize: [{ inlineSize: width, blockSize: height }],
        } as unknown as ResizeObserverEntry,
      ],
      this,
    );
  }
}

function flushFrame(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(16);
}

function dispatchPointer(element: HTMLElement, type: string, init: PointerEventInit = {}): void {
  element.dispatchEvent(
    new PointerEvent(type, {
      clientX: 250,
      clientY: 250,
      pointerType: "mouse",
      ...init,
    }),
  );
}

function setRootRect(root: HTMLElement, width = 500, height = 500): void {
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  });
}

function resize(element: Element, width: number, height: number): void {
  act(() => {
    for (const observer of resizeObservers) observer.emit(element, width, height);
  });
}

async function activate(root: HTMLElement, init: PointerEventInit = {}): Promise<void> {
  await act(async () => {
    dispatchPointer(root, "pointerenter", init);
  });
  await waitFor(() => expect(root).toHaveAttribute("data-inlens-state", "active"));
}

beforeEach(() => {
  nextFrameId = 1;
  frames = new Map();
  resizeObservers = [];
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
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
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("InLens compound components", () => {
  it("server-renders every public part without reading browser globals", () => {
    vi.stubGlobal("window", undefined);

    const html = renderToStaticMarkup(
      <InLens.Root zoom={2}>
        <InLens.Image>
          <img src="source.jpg" alt="Shoe" />
        </InLens.Image>
        <InLens.Lens>
          <InLens.Magnified>
            <img src="large.jpg" alt="" />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker />
        <InLens.Panel>
          <InLens.Magnified>
            <img src="large.jpg" alt="" />
          </InLens.Magnified>
        </InLens.Panel>
      </InLens.Root>,
    );

    expect(html).toContain('data-inlens-slot="root"');
    expect(html).toContain('data-inlens-state="idle"');
    for (const slot of ["image", "lens", "tracker", "panel", "magnified"]) {
      expect(html).toContain(`data-inlens-slot="${slot}"`);
    }
  });

  it("forwards native HTML attributes and event handlers to every public wrapper", () => {
    const mouseMovements: string[] = [];

    render(
      <InLens.Root
        aria-label="root wrapper"
        data-slot="root-wrapper"
        onMouseMove={(event) => {
          event.stopPropagation();
          mouseMovements.push("root");
        }}
      >
        <InLens.Image
          aria-label="image wrapper"
          data-slot="image-wrapper"
          onMouseMove={(event) => {
            event.stopPropagation();
            mouseMovements.push("image");
          }}
        >
          <img src="source.jpg" alt="Shoe" />
        </InLens.Image>
        <InLens.Lens
          as="span"
          aria-label="lens wrapper"
          data-slot="lens-wrapper"
          onMouseMove={(event) => {
            event.stopPropagation();
            mouseMovements.push("lens");
          }}
        >
          <InLens.Magnified
            aria-label="magnified wrapper"
            data-slot="magnified-wrapper"
            onMouseMove={(event) => {
              event.stopPropagation();
              mouseMovements.push("magnified");
            }}
          >
            <img src="large.jpg" alt="" />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker
          aria-label="tracker wrapper"
          data-slot="tracker-wrapper"
          onMouseMove={(event) => {
            event.stopPropagation();
            mouseMovements.push("tracker");
          }}
        />
        <InLens.Panel
          as="aside"
          aria-label="panel wrapper"
          data-slot="panel-wrapper"
          onMouseMove={(event) => {
            event.stopPropagation();
            mouseMovements.push("panel");
          }}
        >
          Panel content
        </InLens.Panel>
      </InLens.Root>,
    );

    for (const slot of ["root", "image", "lens", "magnified", "tracker", "panel"]) {
      const element = document.querySelector<HTMLElement>(`[data-inlens-slot="${slot}"]`)!;
      expect(element).toHaveAttribute("aria-label", `${slot} wrapper`);
      expect(element).toHaveAttribute("data-slot", `${slot}-wrapper`);
      fireEvent.mouseMove(element);
    }

    expect(mouseMovements).toEqual(["root", "image", "lens", "magnified", "tracker", "panel"]);
  });

  it("keeps every visual part mounted while idle", () => {
    render(
      <InLens.Root zoom={2}>
        <InLens.Image>
          <img src="source.jpg" alt="Shoe" />
        </InLens.Image>
        <InLens.Lens>
          <InLens.Magnified>
            <img src="large.jpg" alt="" />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker />
        <InLens.Panel>
          <InLens.Magnified>
            <img src="large.jpg" alt="" />
          </InLens.Magnified>
        </InLens.Panel>
      </InLens.Root>,
    );

    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    expect(root).toHaveAttribute("data-inlens-state", "idle");
    expect(document.querySelector("[data-inlens-slot=lens]")).toBeInTheDocument();
    expect(document.querySelector("[data-inlens-slot=panel]")).toBeInTheDocument();
    expect(document.querySelector("[data-inlens-slot=tracker]")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-inlens-slot=magnified]")).toHaveLength(2);
  });

  it("renders a consumer-selected Tracker wrapper and consumer-owned children", () => {
    render(
      <InLens.Root>
        <InLens.Tracker as="span" className="custom-tracker">
          <span>Zoomed region</span>
        </InLens.Tracker>
        <InLens.Panel>Panel content</InLens.Panel>
      </InLens.Root>,
    );

    const tracker = document.querySelector<HTMLElement>("[data-inlens-slot=tracker]")!;
    expect(tracker.tagName).toBe("SPAN");
    expect(tracker).toHaveClass("custom-tracker");
    expect(tracker).toHaveTextContent("Zoomed region");
  });

  it("does not inspect, clone, or add props to Image and Magnified children", () => {
    const sourceRef = createRef<HTMLImageElement>();
    const largeRef = createRef<HTMLImageElement>();
    const received: Array<Record<string, unknown>> = [];

    function OwnedImage(props: { marker: string; forwardedRef: typeof sourceRef }) {
      received.push({ ...props });
      return <img ref={props.forwardedRef} data-marker={props.marker} alt="" />;
    }

    render(
      <InLens.Root>
        <InLens.Image>
          <OwnedImage marker="source" forwardedRef={sourceRef} />
        </InLens.Image>
        <InLens.Lens>
          <InLens.Magnified>
            <OwnedImage marker="large" forwardedRef={largeRef} />
          </InLens.Magnified>
        </InLens.Lens>
      </InLens.Root>,
    );

    expect(sourceRef.current).toHaveAttribute("data-marker", "source");
    expect(largeRef.current).toHaveAttribute("data-marker", "large");
    expect(received).toEqual([
      { marker: "source", forwardedRef: sourceRef },
      { marker: "large", forwardedRef: largeRef },
    ]);
  });

  it("publishes geometry from observed Root, Lens, and Panel border boxes", async () => {
    render(
      <InLens.Root zoom={2}>
        <InLens.Image>
          <img alt="source" />
        </InLens.Image>
        <InLens.Lens>
          <InLens.Magnified>
            <img alt="" />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker />
        <InLens.Panel>
          <InLens.Magnified>
            <img alt="" />
          </InLens.Magnified>
        </InLens.Panel>
      </InLens.Root>,
    );
    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    const lens = document.querySelector<HTMLElement>("[data-inlens-slot=lens]")!;
    const panel = document.querySelector<HTMLElement>("[data-inlens-slot=panel]")!;
    const tracker = document.querySelector<HTMLElement>("[data-inlens-slot=tracker]")!;
    const magnified = document.querySelectorAll<HTMLElement>("[data-inlens-slot=magnified]");
    setRootRect(root);
    resize(root, 500, 500);
    resize(lens, 100, 80);
    resize(panel, 200, 160);
    await activate(root, { clientX: 250, clientY: 250 });

    expect(root.style.getPropertyValue("--inlens-root-width")).toBe("500px");
    expect(root.style.getPropertyValue("--inlens-root-height")).toBe("500px");
    expect(root.style.getPropertyValue("--inlens-zoom")).toBe("2");
    expect(lens.style.getPropertyValue("--inlens-x")).toBe("200px");
    expect(lens.style.getPropertyValue("--inlens-y")).toBe("210px");
    expect(tracker.style.getPropertyValue("--inlens-x")).toBe("200px");
    expect(tracker.style.getPropertyValue("--inlens-y")).toBe("210px");
    expect(tracker.style.getPropertyValue("--inlens-width")).toBe("100px");
    expect(tracker.style.getPropertyValue("--inlens-height")).toBe("80px");
    expect(magnified[0]?.style.getPropertyValue("--inlens-x")).toBe("-450px");
    expect(magnified[0]?.style.getPropertyValue("--inlens-y")).toBe("-460px");
    expect(magnified[1]?.style.getPropertyValue("--inlens-x")).toBe("-400px");
    expect(magnified[1]?.style.getPropertyValue("--inlens-y")).toBe("-420px");
    expect(panel.getAttribute("style")).toBeNull();
  });

  it("recomputes responsive geometry when CSS resizes any observed surface", async () => {
    render(
      <InLens.Root zoom={2}>
        <InLens.Lens>
          <InLens.Magnified>
            <span />
          </InLens.Magnified>
        </InLens.Lens>
        <InLens.Tracker />
        <InLens.Panel>
          <span />
        </InLens.Panel>
      </InLens.Root>,
    );
    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    const lens = document.querySelector<HTMLElement>("[data-inlens-slot=lens]")!;
    const panel = document.querySelector<HTMLElement>("[data-inlens-slot=panel]")!;
    const tracker = document.querySelector<HTMLElement>("[data-inlens-slot=tracker]")!;
    const magnified = document.querySelector<HTMLElement>("[data-inlens-slot=magnified]")!;
    setRootRect(root, 400, 300);
    resize(root, 400, 300);
    resize(lens, 80, 60);
    resize(panel, 200, 120);
    await activate(root, { clientX: 200, clientY: 150 });

    expect(lens.style.getPropertyValue("--inlens-x")).toBe("160px");
    expect(lens.style.getPropertyValue("--inlens-y")).toBe("120px");

    resize(root, 600, 400);
    resize(lens, 120, 100);
    resize(panel, 300, 180);

    expect(root.style.getPropertyValue("--inlens-root-width")).toBe("600px");
    expect(root.style.getPropertyValue("--inlens-root-height")).toBe("400px");
    expect(lens.style.getPropertyValue("--inlens-x")).toBe("240px");
    expect(lens.style.getPropertyValue("--inlens-y")).toBe("150px");
    expect(tracker.style.getPropertyValue("--inlens-x")).toBe("225px");
    expect(tracker.style.getPropertyValue("--inlens-y")).toBe("155px");
    expect(tracker.style.getPropertyValue("--inlens-width")).toBe("150px");
    expect(tracker.style.getPropertyValue("--inlens-height")).toBe("90px");
    expect(magnified.style.getPropertyValue("--inlens-x")).toBe("-540px");
    expect(magnified.style.getPropertyValue("--inlens-y")).toBe("-350px");
  });

  it("keeps zero-sized compositions idle until CSS supplies measurable dimensions", async () => {
    render(
      <InLens.Root>
        <InLens.Lens>lens</InLens.Lens>
      </InLens.Root>,
    );
    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    const lens = document.querySelector<HTMLElement>("[data-inlens-slot=lens]")!;
    setRootRect(root, 100, 100);
    resize(root, 100, 100);
    resize(lens, 0, 0);

    await act(async () => dispatchPointer(root, "pointerenter", { clientX: 50, clientY: 50 }));
    expect(root).toHaveAttribute("data-inlens-state", "idle");
    expect(lens.style.getPropertyValue("--inlens-x")).toBe("");

    resize(lens, 20, 20);
    await activate(root, { clientX: 50, clientY: 50 });
    expect(lens.style.getPropertyValue("--inlens-x")).toBe("40px");
  });

  it("publishes pointer frames imperatively without React renders", async () => {
    let renderCount = 0;
    function RenderProbe() {
      renderCount += 1;
      return <span data-probe />;
    }

    render(
      <InLens.Root>
        <InLens.Lens>
          <RenderProbe />
        </InLens.Lens>
      </InLens.Root>,
    );
    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    const lens = document.querySelector<HTMLElement>("[data-inlens-slot=lens]")!;
    setRootRect(root, 100, 100);
    resize(root, 100, 100);
    resize(lens, 20, 20);
    const rootStyleWrites = vi.spyOn(root.style, "setProperty");
    await activate(root, { clientX: 20, clientY: 20 });
    expect(renderCount).toBe(1);
    rootStyleWrites.mockClear();

    act(() => {
      dispatchPointer(root, "pointermove", { clientX: 30, clientY: 30 });
      dispatchPointer(root, "pointermove", { clientX: 80, clientY: 80 });
      flushFrame();
    });

    expect(renderCount).toBe(1);
    expect(rootStyleWrites).not.toHaveBeenCalled();
    expect(lens.style.getPropertyValue("--inlens-x")).toBe("70px");
    expect(lens.style.getPropertyValue("--inlens-y")).toBe("70px");
  });

  it("updates behavioral props without replacing the active runtime", async () => {
    function Composition({ zoom, disabled = false }: { zoom: number; disabled?: boolean }) {
      return (
        <InLens.Root zoom={zoom} disabled={disabled}>
          <InLens.Lens>
            <InLens.Magnified>
              <span />
            </InLens.Magnified>
          </InLens.Lens>
        </InLens.Root>
      );
    }

    const { rerender } = render(<Composition zoom={2} />);
    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    const lens = document.querySelector<HTMLElement>("[data-inlens-slot=lens]")!;
    const magnified = document.querySelector<HTMLElement>("[data-inlens-slot=magnified]")!;
    setRootRect(root, 100, 100);
    resize(root, 100, 100);
    resize(lens, 20, 20);
    await activate(root, { clientX: 50, clientY: 50 });
    expect(magnified.style.getPropertyValue("--inlens-x")).toBe("-90px");

    rerender(<Composition zoom={3} />);
    expect(root).toHaveAttribute("data-inlens-state", "active");
    expect(root.style.getPropertyValue("--inlens-zoom")).toBe("3");
    expect(magnified.style.getPropertyValue("--inlens-x")).toBe("-140px");

    rerender(<Composition zoom={3} disabled />);
    expect(root).toHaveAttribute("data-inlens-state", "idle");
  });

  it("preserves consumer CSS and never emits presentation attributes or properties", async () => {
    render(
      <InLens.Root
        as="figure"
        className="root-class"
        style={{ position: "fixed", width: 100, height: 80, backgroundColor: "tomato" }}
      >
        <InLens.Image as="span" className="image-class">
          <img alt="source" />
        </InLens.Image>
        <InLens.Lens
          as="span"
          className="lens-class"
          style={{
            position: "fixed",
            width: 20,
            height: 18,
            transform: "scale(2)",
            overflow: "visible",
            visibility: "visible",
          }}
        >
          lens
        </InLens.Lens>
        <InLens.Panel
          as="aside"
          className="panel-class"
          style={{ position: "absolute", left: 9, width: 50, height: 40, overflow: "visible" }}
        >
          panel
        </InLens.Panel>
      </InLens.Root>,
    );
    const root = document.querySelector<HTMLElement>("figure[data-inlens-slot=root]")!;
    const lens = document.querySelector<HTMLElement>("span[data-inlens-slot=lens]")!;
    const panel = document.querySelector<HTMLElement>("aside[data-inlens-slot=panel]")!;
    setRootRect(root, 100, 80);
    resize(root, 100, 80);
    resize(lens, 20, 18);
    resize(panel, 50, 40);
    await activate(root, { clientX: 50, clientY: 40 });

    expect(root).toHaveClass("root-class");
    expect(root.style.position).toBe("fixed");
    expect(root.style.width).toBe("100px");
    expect(root.style.height).toBe("80px");
    expect(root.style.backgroundColor).toBe("tomato");
    expect(lens).not.toHaveAttribute("data-inlens-shape");
    expect(lens.style.position).toBe("fixed");
    expect(lens.style.width).toBe("20px");
    expect(lens.style.height).toBe("18px");
    expect(lens.style.transform).toBe("scale(2)");
    expect(lens.style.overflow).toBe("visible");
    expect(lens.style.visibility).toBe("visible");
    expect(panel).not.toHaveAttribute("data-inlens-position");
    expect(panel.style.position).toBe("absolute");
    expect(panel.style.left).toBe("9px");
    expect(panel.style.width).toBe("50px");
    expect(panel.style.height).toBe("40px");
    expect(panel.style.overflow).toBe("visible");
    for (const name of ["--inlens-left", "--inlens-top", "--inlens-width", "--inlens-height"]) {
      expect(panel.style.getPropertyValue(name)).toBe("");
    }
  });

  it("isolates dynamically discovered slots to their closest Root", async () => {
    function Composition({ panel }: { panel: boolean }) {
      return (
        <InLens.Root>
          <InLens.Root>
            <InLens.Lens>inner lens</InLens.Lens>
            {panel ? (
              <>
                <InLens.Tracker />
                <InLens.Panel>inner panel</InLens.Panel>
              </>
            ) : null}
          </InLens.Root>
        </InLens.Root>
      );
    }

    const { rerender } = render(<Composition panel={false} />);
    const roots = document.querySelectorAll<HTMLElement>("[data-inlens-slot=root]");
    const outer = roots[0]!;
    const inner = roots[1]!;
    const lens = document.querySelector<HTMLElement>("[data-inlens-slot=lens]")!;
    setRootRect(outer, 200, 200);
    setRootRect(inner, 50, 50);
    resize(outer, 200, 200);
    resize(inner, 50, 50);
    resize(lens, 10, 10);
    await activate(inner, { clientX: 25, clientY: 25 });
    expect(inner).toHaveAttribute("data-inlens-state", "active");
    expect(outer).toHaveAttribute("data-inlens-state", "idle");
    expect(lens.style.getPropertyValue("--inlens-x")).toBe("20px");

    rerender(<Composition panel />);
    const panel = await waitFor(() => {
      const element = document.querySelector<HTMLElement>("[data-inlens-slot=panel]");
      expect(element).not.toBeNull();
      return element!;
    });
    const tracker = document.querySelector<HTMLElement>("[data-inlens-slot=tracker]")!;
    await waitFor(() =>
      expect(resizeObservers.some((observer) => observer.observed.has(panel))).toBe(true),
    );
    resize(panel, 20, 20);
    expect(tracker.style.getPropertyValue("--inlens-width")).toBe("10px");

    const innerObserver = resizeObservers.find((observer) => observer.observed.has(lens))!;
    const outerObserver = resizeObservers.find((observer) => observer.observed.has(outer))!;
    expect(innerObserver.observed.has(panel)).toBe(true);
    expect(outerObserver.observed.has(panel)).toBe(false);
  });

  it("uses the first owned Panel in DOM order for every Tracker", async () => {
    render(
      <InLens.Root zoom={2}>
        <InLens.Tracker />
        <InLens.Panel>first</InLens.Panel>
        <InLens.Panel>second</InLens.Panel>
      </InLens.Root>,
    );
    const root = document.querySelector<HTMLElement>("[data-inlens-slot=root]")!;
    const panels = document.querySelectorAll<HTMLElement>("[data-inlens-slot=panel]");
    const tracker = document.querySelector<HTMLElement>("[data-inlens-slot=tracker]")!;
    setRootRect(root, 500, 500);
    resize(root, 500, 500);
    resize(panels[0]!, 200, 160);
    resize(panels[1]!, 400, 320);
    await activate(root, { clientX: 250, clientY: 250 });

    expect(tracker.style.getPropertyValue("--inlens-width")).toBe("100px");
    expect(tracker.style.getPropertyValue("--inlens-height")).toBe("80px");
  });
});

class ErrorBoundary extends Component<{ children: ReactNode }, { message: string }> {
  state = { message: "" };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void error;
    void info;
  }

  render() {
    return this.state.message ? <p>{this.state.message}</p> : this.props.children;
  }
}

describe("Tracker structure", () => {
  it("always throws after discovery when no Panel exists", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <InLens.Root>
          <InLens.Tracker />
        </InLens.Root>
      </ErrorBoundary>,
    );
    expect(
      await screen.findByText("<InLens.Tracker> requires a <InLens.Panel> in the same Root."),
    ).toBeInTheDocument();
  });
});
