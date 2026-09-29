import { expect, test, type Page } from "@playwright/test";

const URL = "/algorithms/bst-traversals?problem=validate-binary-search-tree";

async function frozen(page: Page) {
  const geometry = await page.evaluate(() => {
    const scroll = [...document.querySelectorAll<HTMLElement>("body *")].filter((node) => {
      const style = getComputedStyle(node);
      return [style.overflow, style.overflowX, style.overflowY].some((value) =>
        /^(auto|scroll)$/.test(value),
      );
    });
    return {
      cw: document.documentElement.clientWidth,
      ch: document.documentElement.clientHeight,
      sw: document.documentElement.scrollWidth,
      sh: document.documentElement.scrollHeight,
      x: scrollX,
      y: scrollY,
      n: scroll.length,
    };
  });
  expect(geometry.sw).toBeLessThanOrEqual(geometry.cw + 1);
  expect(geometry.sh).toBeLessThanOrEqual(geometry.ch + 1);
  expect(geometry.x).toBe(0);
  expect(geometry.y).toBe(0);
  expect(geometry.n).toBe(0);
}

test("Validate BST golden slice checks inherited bounds and opens trace", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole("heading", { name: "Validate Binary Search Tree" })).toBeVisible();
  await expect(page.getByTestId("tree-scroll-viewport")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("code")).toHaveCount(7);
  await expect(page.getByText("bounds:", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/\(-∞, \+∞\)/).first()).toBeVisible();
  await frozen(page);

  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/validate-binary-search-tree/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/diameter-of-binary-tree/,
  );

  const next = page
    .getByRole("region", { name: "Playback" })
    .getByRole("button", { name: "Next step (→)" });
  await next.click();
  await next.click();
  const gate = page.locator("[data-prediction-gate]");
  await expect(gate.getByRole("radio")).toHaveCount(3);
  await gate.getByRole("radio", { name: "accept node; validate its subtrees" }).check();
  await gate.getByRole("button", { name: "Check answer" }).click();
  await gate.getByRole("button", { name: "Continue" }).click();
  await stages.getByRole("link", { name: "Trace" }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trace it yourself" }).getByRole("radio"),
  ).toHaveCount(3);
  await frozen(page);
});

test("Validate BST maximum tree keeps every node and control visible", async ({ page }) => {
  const input = Buffer.from(
    JSON.stringify({ tree: "[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]" }),
    "utf8",
  ).toString("base64");
  await page.goto(`${URL}&input=${encodeURIComponent(input)}&step=999`);
  await expect(page.getByRole("img", { name: /Tree with 15 nodes and 14 edges/ })).toBeVisible();
  await expect(page.getByText("Step 62 of 62")).toBeVisible();
  await expect(
    page.getByText("Return true: every node satisfied its inherited bounds."),
  ).toBeVisible();
  await expect(page.getByText("recursion depth:", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay (Space)" })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    };
    return {
      world: bounds('[aria-label="Algorithm world"]'),
      playback: bounds('[aria-label="Playback"]'),
    };
  });
  expect(geometry.world!.bottom).toBeLessThan(geometry.playback!.top);
  expect(geometry.playback!.bottom).toBeLessThanOrEqual(900);
  await frozen(page);
});
