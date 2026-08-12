import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

function example(page: Page, name: string): Locator {
  return page.locator(`[data-example="${name}"]`);
}

function rootFor(page: Page, name: string): Locator {
  return example(page, name).locator('[data-inlens-slot="root"]');
}

async function hoverCenter(root: Locator): Promise<void> {
  await root.scrollIntoViewIfNeeded();
  const size = await root.evaluate((element) => ({
    width: (element as HTMLElement).offsetWidth,
    height: (element as HTMLElement).offsetHeight,
  }));
  await root.hover({ position: { x: size.width / 2, y: size.height / 2 } });
}

test("Server Component renders three distinct next/image compositions", async ({ page }) => {
  const consoleProblems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleProblems.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleProblems.push(error.message));

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The atlas refuses to stay still." }),
  ).toBeVisible();
  await expect(page.locator("[data-example]")).toHaveCount(3);
  await expect(page.locator('[data-inlens-slot="root"]')).toHaveCount(3);

  for (const name of ["astral-orrery", "radioactive-receipt", "dream-cartography"]) {
    const root = rootFor(page, name);
    await expect(root).toHaveAttribute("data-inlens-state", "idle");
    await expect(example(page, name).locator('[data-inlens-slot="image"] img')).toHaveCount(1);
    await hoverCenter(root);
    await expect(root).toHaveAttribute("data-inlens-state", "active");
  }

  const orrery = example(page, "astral-orrery");
  await expect(orrery.locator('[data-inlens-slot="lens"]')).toHaveCount(1);
  await expect(orrery.locator('[data-inlens-slot="panel"]')).toHaveCount(2);
  await expect(orrery.locator('[data-inlens-slot="tracker"]')).toHaveCount(1);

  const receipt = example(page, "radioactive-receipt");
  await expect(receipt.locator('[data-inlens-slot="lens"]')).toHaveCount(1);
  await expect(receipt.locator('[data-inlens-slot="panel"]')).toHaveCount(1);
  await expect(receipt.locator('[data-inlens-slot="tracker"]')).toHaveCount(1);

  const shards = example(page, "dream-cartography");
  await expect(shards.locator('[data-inlens-slot="lens"]')).toHaveCount(3);
  await expect(shards.locator('[data-inlens-slot="panel"]')).toHaveCount(0);

  expect(consoleProblems).toEqual([]);
});

test("CSS changes the radioactive beam orientation without client page code", async ({ page }) => {
  await page.goto("/");
  const root = rootFor(page, "radioactive-receipt");
  const beam = example(page, "radioactive-receipt").locator('[data-inlens-slot="lens"]');
  const desktop = await beam.evaluate((element) => ({
    width: (element as HTMLElement).offsetWidth,
    height: (element as HTMLElement).offsetHeight,
  }));
  expect(desktop.height).toBeGreaterThan(desktop.width);

  await page.setViewportSize({ width: 600, height: 900 });
  await root.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => beam.evaluate((element) => (element as HTMLElement).offsetWidth))
    .toBeGreaterThan(100);
  const mobile = await beam.evaluate((element) => ({
    width: (element as HTMLElement).offsetWidth,
    height: (element as HTMLElement).offsetHeight,
  }));
  expect(mobile.width).toBeGreaterThan(mobile.height);

  await hoverCenter(root);
  await expect(root).toHaveAttribute("data-inlens-state", "active");
  await expect(beam).toBeVisible();
});
