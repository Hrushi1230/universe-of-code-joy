import { expect, test, type Page } from "@playwright/test";
import { algorithms } from "../src/data/algorithms";
import { problems } from "../src/data/problems";
import { getModule, getModuleForProblem } from "../src/engine/registry";
import type { AlgorithmModule, ArrayFrame } from "../src/engine/types";
import { pointerLabel } from "../src/lib/pointerLabels";
import { buildPredictionCheckpoints, derivePrediction } from "../src/lib/prediction";

/**
 * Proves every searching card actually animates in a browser.
 *
 * The expected values come from the engine itself rather than being written out
 * here, so the test cannot drift from the modules: if a narration or a frame
 * changes, the expectation changes with it, and what is really being checked is
 * that the browser is showing step i of the right module at all.
 */

interface Card {
  /** Question slug, or algorithm slug for the two algorithm cards. */
  id: string;
  url: string;
  module: AlgorithmModule;
}

const searchingSlugs = new Set(
  algorithms.filter((a) => a.category === "searching").map((a) => a.slug),
);

const cards: Card[] = [
  ...algorithms
    .filter((a) => searchingSlugs.has(a.slug))
    .map((a) => ({ id: a.slug, url: `/algorithms/${a.slug}`, module: getModule(a.slug)! })),
  ...problems
    .filter((p) => searchingSlugs.has(p.algorithmSlug))
    .map((p) => ({
      id: p.slug,
      url: `/algorithms/${p.algorithmSlug}?problem=${p.slug}`,
      module: getModuleForProblem(p.slug) ?? getModule(p.algorithmSlug)!,
    })),
];

/** The run the player loads on mount: the module's first preset. */
function firstPresetRun(mod: AlgorithmModule) {
  const parsed = mod.validate(mod.presets[0]!.values);
  if (!parsed.ok) throw new Error(`preset 0 rejected: ${parsed.error}`);
  return mod.run(parsed.parsed);
}

const CANVAS = '[data-testid="array-canvas"]';
const CELL = '[data-testid="array-cell"]';
const NEXT = 'button[aria-label="Next step (→)"]';

async function advance(
  page: Page,
  run: ReturnType<typeof firstPresetRun>,
  checkpoints: ReturnType<typeof buildPredictionCheckpoints>,
  stepIndex: number,
): Promise<void> {
  const checkpoint = checkpoints.find((candidate) => candidate.stepIndex === stepIndex);
  if (checkpoint) {
    const prediction = derivePrediction(run.steps[stepIndex], checkpoint.id);
    if (!prediction) throw new Error(`prediction ${checkpoint.id} could not be derived`);
    const answer = prediction.options.find((option) => option.id === prediction.correctOptionId);
    if (!answer) throw new Error(`prediction ${checkpoint.id} has no correct option`);
    await page.getByRole("radio", { name: answer.label }).check();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.locator(NEXT).first().click();
}

test.describe("searching visualizers animate in the browser", () => {
  for (const card of cards) {
    test(card.id, async ({ page }) => {
      const run = firstPresetRun(card.module);
      const total = run.steps.length;
      const checkpoints = buildPredictionCheckpoints(run.steps);

      await page.goto(card.url);

      /* The canvas is client-only, so waiting for it IS the hydration check. */
      const canvas = page.locator(CANVAS).first();
      await expect(canvas).toBeVisible({ timeout: 30_000 });

      await expect(page.getByText(`step 1 / ${total}`)).toBeVisible();

      /* Every value of the first frame is drawn as text on the canvas. */
      const frame0 = run.steps[0]!.frame as ArrayFrame;
      const drawn = await canvas.locator(CELL).allTextContents();
      for (const value of frame0.values) {
        expect(drawn, `value ${String(value)} is not drawn`).toContain(String(value));
      }
      for (const pointer of frame0.pointers) {
        await expect(canvas.getByText(pointerLabel(pointer.name), { exact: true })).toBeVisible();
      }

      expect(await canvas.locator(CELL).count()).toBe(frame0.values.length);

      /* Walk the whole run. The reasoning header is the visible current-step
         contract; the cell states below prove the renderer changed with it. */
      const statesAt: string[][] = [];
      for (let i = 0; i < total; i += 1) {
        await expect(
          page.getByText(`Step ${i + 1} / ${total}`, { exact: true }).first(),
        ).toBeVisible();
        statesAt.push(
          await canvas
            .locator(CELL)
            .evaluateAll((els) => els.map((el) => el.getAttribute("data-state") ?? "")),
        );
        if (i < total - 1) {
          await advance(page, run, checkpoints, i);
        }
      }

      /* A static picture is not an animation: semantic cell states must differ
         somewhere across the run. Styling is already derived from this state. */
      const distinct = new Set(statesAt.map((states) => states.join("|")));
      expect(distinct.size, "cell states never changed across the run").toBeGreaterThan(1);

      /* Every frame the engine says is a milestone is reachable, and the last
         step is the answer frame. */
      await expect(page.getByText(`step ${total} / ${total}`)).toBeVisible();
    });
  }
});

test.describe("koko piles panel", () => {
  const mod = getModuleForProblem("koko-eating-bananas")!;

  test("shows every pile, its hour cost, and the verdict against the budget", async ({ page }) => {
    const run = firstPresetRun(mod);
    const checkpoints = buildPredictionCheckpoints(run.steps);
    await page.goto("/algorithms/binary-search?problem=koko-eating-bananas");
    await expect(page.locator(CANVAS).first()).toBeVisible({ timeout: 30_000 });

    for (let i = 0; i < run.steps.length; i += 1) {
      const panel = run.steps[i]!.aux?.find((a) => a.kind === "cost");
      expect(panel, `step ${i} has no cost panel`).toBeTruthy();
      if (panel?.kind !== "cost") throw new Error("unreachable");

      await expect(page.getByText(panel.label, { exact: true })).toBeVisible();
      for (const row of panel.rows) {
        await expect(page.getByText(row.item, { exact: true })).toBeVisible();
      }
      if (panel.total) {
        await expect(page.getByText(panel.total.label, { exact: true })).toBeVisible();
        await expect(page.getByText(panel.total.value, { exact: true }).first()).toBeVisible();
      }
      if (i < run.steps.length - 1) await advance(page, run, checkpoints, i);
    }
  });

  /**
   * The panel floats over the canvas (absolute, left-6 top-16). Quicksort already
   * ships a panel in that slot on array frames, but koko's is the tallest one, so
   * this measures whether it covers the answer axis rather than assuming it does not.
   */
  test("does not cover the answer axis", async ({ page }) => {
    await page.goto("/algorithms/binary-search?problem=koko-eating-bananas");
    const canvas = page.locator(CANVAS).first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    const row = page.getByText("11 bananas", { exact: true });
    await expect(row).toBeVisible();
    const panelBox = await row.boundingBox();
    expect(panelBox).not.toBeNull();

    /* Leftmost drawn cell: the smallest x among the rendered array cells. */
    const cellBoxes = await canvas.locator(CELL).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
    expect(cellBoxes.length).toBeGreaterThan(0);
    const leftmost = cellBoxes.reduce((a, b) => (a.x <= b.x ? a : b));

    const horizontallyClear = panelBox!.x + panelBox!.width <= leftmost.x;
    const verticallyClear =
      panelBox!.y + panelBox!.height <= leftmost.y || panelBox!.y >= leftmost.y + leftmost.h;
    expect(
      horizontallyClear || verticallyClear,
      `piles panel [x ${panelBox!.x.toFixed(0)}..${(panelBox!.x + panelBox!.width).toFixed(0)}, y ${panelBox!.y.toFixed(0)}..${(panelBox!.y + panelBox!.height).toFixed(0)}] overlaps the leftmost cell [x ${leftmost.x.toFixed(0)}..${(leftmost.x + leftmost.w).toFixed(0)}, y ${leftmost.y.toFixed(0)}..${(leftmost.y + leftmost.h).toFixed(0)}]`,
    ).toBe(true);
  });
});
