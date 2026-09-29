import { expect, test, type Page } from "@playwright/test";
const URL = "/algorithms/level-order?problem=invert-binary-tree";
async function frozen(page: Page) {
  const g = await page.evaluate(() => {
    const a = [...document.querySelectorAll<HTMLElement>("body *")].filter((n) => {
      const s = getComputedStyle(n);
      return [s.overflow, s.overflowX, s.overflowY].some((v) => /^(auto|scroll)$/.test(v));
    });
    return {
      cw: document.documentElement.clientWidth,
      ch: document.documentElement.clientHeight,
      sw: document.documentElement.scrollWidth,
      sh: document.documentElement.scrollHeight,
      x: scrollX,
      y: scrollY,
      n: a.length,
    };
  });
  expect(g.sw).toBeLessThanOrEqual(g.cw + 1);
  expect(g.sh).toBeLessThanOrEqual(g.ch + 1);
  expect(g.x).toBe(0);
  expect(g.y).toBe(0);
  expect(g.n).toBe(0);
}
test("Invert Binary Tree golden slice swaps links and stays fixed", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole("heading", { name: "Invert Binary Tree" })).toBeVisible();
  await expect(page.getByTestId("tree-scroll-viewport")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("code")).toHaveCount(11);
  await frozen(page);
  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/invert-binary-tree/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/binary-tree-level-order/,
  );
  await page
    .getByRole("region", { name: "Playback" })
    .getByRole("button", { name: "Next step (→)" })
    .click();
  const gate = page.locator("[data-prediction-gate]");
  await expect(gate.getByRole("radio")).toHaveCount(3);
  await gate.getByRole("radio", { name: "swap left and right child links" }).check();
  await gate.getByRole("button", { name: "Check answer" }).click();
  await gate.getByRole("button", { name: "Continue" }).click();
  await stages.getByRole("link", { name: "Trace" }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trace it yourself" }).getByRole("radio"),
  ).toHaveCount(3);
  await frozen(page);
});
test("Invert Binary Tree maximum mirrored tree keeps all controls visible", async ({ page }) => {
  const input = Buffer.from(
    JSON.stringify({ tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" }),
    "utf8",
  ).toString("base64");
  await page.goto(`${URL}&input=${encodeURIComponent(input)}&step=999`);
  await expect(page.getByRole("img", { name: /Tree with 15 nodes and 14 edges/ })).toBeVisible();
  await expect(page.getByText("Step 32 of 32")).toBeVisible();
  await expect(page.getByText("Return the fully mirrored root.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay (Space)" })).toBeVisible();
  const p = await page.evaluate(() => {
    const b = (s: string) => {
      const e = document.querySelector(s)!;
      const r = e.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    };
    return { w: b('[aria-label="Algorithm world"]'), p: b('[aria-label="Playback"]') };
  });
  expect(p.w.bottom).toBeLessThan(p.p.top);
  expect(p.p.bottom).toBeLessThanOrEqual(900);
  await frozen(page);
});
