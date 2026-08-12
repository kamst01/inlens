import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  return page.locator(`[data-example="${name}"]`);
}

function rootFor(page: Page, name: string): Locator {
  return example(page, name).locator('[data-inlens-slot="root"]');
}

async function positionXY(locator: Locator): Promise<{ x: number; y: number }> {
  return locator.evaluate((element) => ({
    x: Number.parseFloat((element as HTMLElement).style.getPropertyValue("--inlens-x")),
    y: Number.parseFloat((element as HTMLElement).style.getPropertyValue("--inlens-y")),
  }));
}

async function hoverCenter(root: Locator): Promise<void> {
  await root.scrollIntoViewIfNeeded();
  const size = await root.evaluate((element) => ({
    width: (element as HTMLElement).offsetWidth,
    height: (element as HTMLElement).offsetHeight,
  }));
  await root.hover({ position: { x: size.width / 2, y: size.height / 2 } });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders three distinct CSS-owned React compositions", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Three unreasonable magnifiers." })).toBeVisible();
  await expect(page.locator("[data-example]")).toHaveCount(3);
  await expect(page.locator('[data-inlens-slot="root"]')).toHaveCount(3);

  for (const name of ["chromatic-triplets", "conspiracy-microscope", "wormhole-radio"]) {
    const root = rootFor(page, name);
    await expect(root).toHaveAttribute("data-inlens-state", "idle");
    await expect(example(page, name).locator('[data-inlens-slot="image"] img')).toHaveCount(1);
  }

  await expect(
    example(page, "chromatic-triplets").locator('[data-inlens-slot="lens"]'),
  ).toHaveCount(3);
  await expect(
    example(page, "conspiracy-microscope").locator('[data-inlens-slot="panel"]'),
  ).toHaveCount(2);
  await expect(example(page, "wormhole-radio").locator('[data-inlens-slot="lens"]')).toHaveCount(1);
});

test("Chromatic Triplets activates three independently measured lenses", async ({ page }) => {
  const section = example(page, "chromatic-triplets");
  const root = rootFor(page, "chromatic-triplets");
  const lenses = section.locator('[data-inlens-slot="lens"]');
  await hoverCenter(root);

  await expect(root).toHaveAttribute("data-inlens-state", "active");
  await expect(lenses).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await expect(lenses.nth(index)).toBeVisible();
  await expect(section.locator('[data-inlens-slot="panel"]')).toHaveCount(0);

  const dimensions = await root.evaluate((rootElement) => {
    const lens = rootElement.querySelector<HTMLElement>('[data-inlens-slot="lens"]')!;
    return {
      rootWidth: (rootElement as HTMLElement).offsetWidth,
      rootHeight: (rootElement as HTMLElement).offsetHeight,
      lensWidth: lens.offsetWidth,
      lensHeight: lens.offsetHeight,
    };
  });
  const position = await positionXY(lenses.first());
  expect(position.x).toBeCloseTo((dimensions.rootWidth - dimensions.lensWidth) / 2, 0);
  expect(position.y).toBeCloseTo((dimensions.rootHeight - dimensions.lensHeight) / 2, 0);

  await page.mouse.move(10, 10);
  await expect(root).toHaveAttribute("data-inlens-state", "idle");
  for (let index = 0; index < 3; index += 1) await expect(lenses.nth(index)).toBeHidden();
});

test("Conspiracy Microscope tracks the first of two Panels and clamps at both edges", async ({
  page,
}) => {
  const section = example(page, "conspiracy-microscope");
  const root = rootFor(page, "conspiracy-microscope");
  const tracker = section.locator('[data-inlens-slot="tracker"]');
  const panels = section.locator('[data-inlens-slot="panel"]');
  await root.scrollIntoViewIfNeeded();
  await root.hover({ position: { x: 1, y: 1 } });

  await expect(root).toHaveAttribute("data-inlens-state", "active");
  await expect(panels).toHaveCount(2);
  await expect(panels.first()).toBeVisible();
  await expect(panels.last()).toBeVisible();
  await expect(tracker).toBeVisible();
  await expect.poll(async () => positionXY(tracker)).toEqual({ x: 0, y: 0 });

  const geometry = await root.evaluate((rootElement) => {
    const panel = rootElement.querySelector<HTMLElement>('[data-inlens-slot="panel"]')!;
    const zoom = Number.parseFloat(
      (rootElement as HTMLElement).style.getPropertyValue("--inlens-zoom"),
    );
    return {
      rootWidth: (rootElement as HTMLElement).offsetWidth,
      rootHeight: (rootElement as HTMLElement).offsetHeight,
      panelWidth: panel.offsetWidth,
      panelHeight: panel.offsetHeight,
      zoom,
    };
  });
  const rootBox = await root.boundingBox();
  if (!rootBox) throw new Error("Evidence Root has no bounding box.");
  await root.dispatchEvent("pointermove", {
    pointerType: "mouse",
    clientX: rootBox.x + rootBox.width - 2,
    clientY: rootBox.y + rootBox.height - 2,
  });

  await expect
    .poll(async () => (await positionXY(tracker)).x)
    .toBeCloseTo(
      geometry.rootWidth - Math.min(geometry.rootWidth, geometry.panelWidth / geometry.zoom),
      0,
    );
  await expect
    .poll(async () => (await positionXY(tracker)).y)
    .toBeCloseTo(
      geometry.rootHeight - Math.min(geometry.rootHeight, geometry.panelHeight / geometry.zoom),
      0,
    );
});

test("captured scroll republishes from cached viewport coordinates", async ({ page }) => {
  const root = rootFor(page, "chromatic-triplets");
  const lens = example(page, "chromatic-triplets").locator('[data-inlens-slot="lens"]').first();
  await hoverCenter(root);
  const before = await positionXY(lens);

  await page.evaluate(() => window.scrollBy(0, 40));

  await expect.poll(async () => (await positionXY(lens)).y).toBeCloseTo(before.y + 40, 0);
  await expect(root).toHaveAttribute("data-inlens-state", "active");
});

test("touch input never activates", async ({ page }) => {
  const root = rootFor(page, "wormhole-radio");
  await root.scrollIntoViewIfNeeded();
  await root.dispatchEvent("pointerenter", {
    pointerType: "touch",
    clientX: 250,
    clientY: 250,
  });
  await expect(root).toHaveAttribute("data-inlens-state", "idle");
  await expect(example(page, "wormhole-radio").locator('[data-inlens-slot="lens"]')).toBeHidden();
});

test("mouse remains usable in a touch-capable hybrid context", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: false,
    viewport: { width: 1280, height: 900 },
  });
  const hybridPage = await context.newPage();
  await hybridPage.goto("http://127.0.0.1:4173/");
  const root = rootFor(hybridPage, "wormhole-radio");
  await hoverCenter(root);
  await expect(root).toHaveAttribute("data-inlens-state", "active");
  await context.close();
});
