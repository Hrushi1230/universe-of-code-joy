import { expect, test, type Page } from "@playwright/test";
const URL = "/algorithms/level-order?problem=maximum-depth-of-binary-tree";
async function frozen(page: Page) {
  const g = await page.evaluate(() => {
    const scroll = [...document.querySelectorAll<HTMLElement>("body *")].filter((n) => {
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
      n: scroll.length,
    };
  });
  expect(g.sw).toBeLessThanOrEqual(g.cw + 1);
  expect(g.sh).toBeLessThanOrEqual(g.ch + 1);
  expect(g.x).toBe(0);
  expect(g.y).toBe(0);
  expect(g.n).toBe(0);
}
test("Maximum Depth golden slice stays fixed and requires prediction", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole("heading", { name: "Maximum Depth of Binary Tree" })).toBeVisible();
  await expect(page.getByTestId("tree-scroll-viewport")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("code")).toHaveCount(12);
  await frozen(page);
  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/maximum-depth-of-binary-tree/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/invert-binary-tree/,
  );
  const next = page
    .getByRole("region", { name: "Playback" })
    .getByRole("button", { name: "Next step (→)" });
  for (let i = 0; i < 3; i += 1) await next.click();
  const gate = page.locator("[data-prediction-gate]");
  await expect(gate.getByRole("radio")).toHaveCount(2);
  await gate.getByRole("radio", { name: "continue to the next level" }).check();
  await gate.getByRole("button", { name: "Check answer" }).click();
  await gate.getByRole("button", { name: "Continue" }).click();
  await stages.getByRole("link", { name: "Trace" }).click();
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trace it yourself" }).getByRole("radio"),
  ).toHaveCount(2);
  await frozen(page);
});
test("Maximum Depth maximum tree keeps all nodes and controls visible", async ({ page }) => {
  const input = Buffer.from(
    JSON.stringify({ tree: "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]" }),
    "utf8",
  ).toString("base64");
  await page.goto(`${URL}&input=${encodeURIComponent(input)}&step=999`);
  await expect(page.getByRole("img", { name: /Tree with 15 nodes and 14 edges/ })).toBeVisible();
  await expect(page.getByText("Step 25 of 25")).toBeVisible();
  await expect(page.getByText("Return maximum depth 4.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay (Space)" })).toBeVisible();
  const p = await page.evaluate(() => {
    const b = (s: string) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    };
    return { world: b('[aria-label="Algorithm world"]'), playback: b('[aria-label="Playback"]') };
  });
  expect(p.world!.bottom).toBeLessThan(p.playback!.top);
  expect(p.playback!.bottom).toBeLessThanOrEqual(900);
  await frozen(page);
});
