import { expect, test, type Page } from "@playwright/test";

const RIGHT_VIEW_URL = "/algorithms/level-order?problem=binary-tree-right-side-view";

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

test("Binary Tree Right Side View golden slice stays fixed and requires prediction", async ({
  page,
}) => {
  await page.goto(RIGHT_VIEW_URL);

  await expect(page.getByRole("heading", { name: "Binary Tree Right Side View" })).toBeVisible();
  await expect(page.getByTestId("tree-scroll-viewport")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("tree-scroll-viewport")).toHaveAttribute(
    "data-over-limit",
    "false",
  );
  await expect(page.getByRole("img", { name: /Tree with 5 nodes and 4 edges/ })).toBeVisible();
  await expect(page.locator("code")).toHaveCount(12);
  await expect(page.locator("code").last()).toHaveText("} return out;}");
  await expectFrozenViewport(page);

  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/binary-tree-right-side-view\?.*problem=binary-tree-right-side-view.*stage=code/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/maximum-depth-of-binary-tree\?.*problem=binary-tree-right-side-view.*stage=solve/,
  );
  await expect(stages.getByRole("link", { name: "Review" })).toHaveAttribute(
    "href",
    /\/review\?algorithm=level-order&problem=binary-tree-right-side-view/,
  );

  const next = page
    .getByRole("region", { name: "Playback" })
    .getByRole("button", { name: "Next step (→)" });
  await next.click();
  await next.click();

  const prediction = page.locator("[data-prediction-gate]");
  await expect(page.getByText("Prediction checkpoint — Your turn")).toBeVisible();
  await expect(prediction.getByRole("radio")).toHaveCount(2);
  await prediction.getByRole("radio", { name: "append node to right view" }).check();
  await prediction.getByRole("button", { name: "Check answer" }).click();
  await prediction.getByRole("button", { name: "Continue" }).click();
  await expectFrozenViewport(page);

  await stages.getByRole("link", { name: "Trace" }).click();
  await expect(page.getByRole("heading", { name: "Trace it yourself" })).toBeVisible();
  await expect(page.getByText("Step 1 of 6")).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Your trace" })
      .getByRole("img", { name: /Tree with 6 nodes and 5 edges/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trace it yourself" }).getByRole("radio"),
  ).toHaveCount(2);
  await expectFrozenViewport(page);
});

test("Binary Tree Right Side View maximum tree keeps every node and control visible", async ({
  page,
}) => {
  const input = Buffer.from(
    JSON.stringify({ tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" }),
    "utf8",
  ).toString("base64");
  await page.goto(`${RIGHT_VIEW_URL}&input=${encodeURIComponent(input)}&step=999`);

  await expect(page.getByTestId("tree-scroll-viewport")).toHaveAttribute(
    "data-over-limit",
    "false",
  );
  await expect(page.getByRole("img", { name: /Tree with 15 nodes and 14 edges/ })).toBeVisible();
  await expect(page.getByText("Step 39 of 39")).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay (Space)" })).toBeVisible();
  await expect(page.getByText("The queue is empty after 4 levels.", { exact: true })).toBeVisible();
  await expect(page.getByText("Return [1, 3, 7, 15].", { exact: true })).toBeVisible();

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
