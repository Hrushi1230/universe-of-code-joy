import { expect, test, type Page } from "@playwright/test";

const TWO_SUM_URL = "/algorithms/two-pointers?problem=two-sum";

async function expectFrozenViewport(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const scrollEnabled = [...document.querySelectorAll<HTMLElement>("body *")].filter((node) => {
      const style = getComputedStyle(node);
      return [style.overflow, style.overflowX, style.overflowY].some((value) =>
        /^(auto|scroll)$/.test(value),
      );
    });
    return {
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      scrollEnabled: scrollEnabled.length,
    };
  });

  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  expect(geometry.scrollX).toBe(0);
  expect(geometry.scrollY).toBe(0);
  expect(geometry.scrollEnabled).toBe(0);
}

test("Two Sum golden slice stays fixed and requires prediction", async ({ page }) => {
  await page.goto(TWO_SUM_URL);

  await expect(
    page.getByRole("heading", { name: "Two Sum II — Input Array Is Sorted" }),
  ).toBeVisible();
  await expect(page.getByTestId("array-canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("array-cell")).toHaveCount(4);
  await expect(page.locator("code")).toHaveCount(12);
  await expect(page.locator("code").last()).toHaveText("}");
  await expectFrozenViewport(page);

  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/two-sum\?.*problem=two-sum.*stage=code/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/container-with-most-water\?.*problem=two-sum.*stage=solve/,
  );
  await expect(stages.getByRole("link", { name: "Review" })).toHaveAttribute(
    "href",
    /\/review\?algorithm=two-pointers&problem=two-sum/,
  );

  await page
    .getByRole("region", { name: "Playback" })
    .getByRole("button", { name: "Next step (→)" })
    .click();

  const prediction = page.locator("[data-prediction-gate]");
  await expect(page.getByText("Prediction checkpoint — Your turn")).toBeVisible();
  await expect(prediction.getByRole("radio")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Answer the prediction to continue" }),
  ).toHaveAttribute("aria-disabled", "true");

  await prediction.getByRole("radio", { name: "right--" }).check();
  await prediction.getByRole("button", { name: "Check answer" }).click();
  await expect(prediction.getByRole("button", { name: "Continue" })).toBeVisible();
  await prediction.getByRole("button", { name: "Continue" }).click();
  await expectFrozenViewport(page);

  await stages.getByRole("link", { name: "Trace" }).click();
  await expect(page.getByRole("heading", { name: "Trace it yourself" })).toBeVisible();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trace it yourself" }).getByRole("radio"),
  ).toHaveCount(3);
  await expectFrozenViewport(page);
});

test("Two Sum maximum input keeps all nodes and controls visible", async ({ page }) => {
  const input = Buffer.from(
    JSON.stringify({
      values: "-9, -6, -3, -1, 0, 2, 4, 7, 9, 12, 15, 20",
      target: "13",
    }),
    "utf8",
  ).toString("base64");

  await page.goto(`${TWO_SUM_URL}&input=${encodeURIComponent(input)}&step=999`);

  await expect(page.getByTestId("array-cell")).toHaveCount(12);
  await expect(page.getByText("Step 21 of 21")).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay (Space)" })).toBeVisible();

  const panels = await page.evaluate(() => {
    const measure = (selector: string) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    };
    return {
      world: measure('[aria-label="Algorithm world"]'),
      playback: measure('[aria-label="Playback"]'),
    };
  });

  expect(panels.world).not.toBeNull();
  expect(panels.playback).not.toBeNull();
  expect(panels.world!.bottom).toBeLessThan(panels.playback!.top);
  expect(panels.playback!.bottom).toBeLessThanOrEqual(900);
  await expectFrozenViewport(page);
});
