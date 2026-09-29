import { expect, test, type Page } from "@playwright/test";
import { reviewItems } from "../src/data/review-items";

const binarySearchReviewItems = reviewItems.filter(
  (item) => item.algorithmSlug === "binary-search",
);

const SEARCH_SOLUTION = `function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`;

const INSERT_SOLUTION = `function searchInsert(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return low;
}`;

async function submitSolution(page: Page, solution: string): Promise<void> {
  await page.getByLabel("Solution code editor").fill(solution);
  /* The previous accepted toast sits over the next screen's Submit button.
     Moving away lets Sonner's normal dismissal timer resume. */
  await page.mouse.move(0, 0);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10_000 });
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(/\/practice\/results$/, { timeout: 30_000 });
  /* At 320px the new results toast appears under the desktop test cursor and
     stays hovered forever. Move away so its normal dismissal timer can run. */
  await page.mouse.move(0, 0);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10_000 });
}

async function finishReview(page: Page): Promise<void> {
  for (let index = 0; index < binarySearchReviewItems.length; index += 1) {
    const item = binarySearchReviewItems[index]!;
    const answer = item.choices.find((choice) => choice.id === item.answerId);
    if (!answer) throw new Error(`Review item ${item.id} has no answer choice`);

    await expect(
      page.getByText(`Review ${index + 1} of ${binarySearchReviewItems.length}`),
    ).toBeVisible();
    await page.getByRole("radio", { name: answer.label }).check();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page
      .getByRole("button", {
        name: index + 1 === binarySearchReviewItems.length ? "Finish review" : "Continue",
      })
      .click();
  }

  await expect(page.getByRole("heading", { name: "Binary Search review complete" })).toBeVisible();
  await expect(
    page.getByText(
      `${binarySearchReviewItems.length} of ${binarySearchReviewItems.length} recalled on the first try.`,
    ),
  ).toBeVisible();
}

async function expectNoPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function verifyGoldenJourney(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("golden-e2e-cleared")) return;
    window.localStorage.clear();
    window.sessionStorage.setItem("golden-e2e-cleared", "true");
  });

  await page.goto("/algorithms/binary-search");
  await expect(page.getByTestId("array-canvas").first()).toBeVisible({ timeout: 30_000 });
  await expectNoPageOverflow(page);

  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/binary-search-classic.*stage=code/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/search-insert-position.*stage=solve/,
  );
  await expect(stages.getByRole("link", { name: "Review" })).toHaveAttribute(
    "href",
    /\/review.*algorithm=binary-search/,
  );

  await stages.getByRole("link", { name: "Code" }).click();
  await expect(page.getByRole("heading", { name: "Classic Binary Search" })).toBeVisible();
  await expect(page.getByText("Code stage — now implement it")).toBeVisible();
  await expectNoPageOverflow(page);
  await submitSolution(page, SEARCH_SOLUTION);
  await expectNoPageOverflow(page);

  const transfer = page.getByRole("link", {
    name: "Apply Binary Search to a new problem",
  });
  await expect(transfer).toBeVisible();
  await transfer.click();
  await expect(page.getByRole("heading", { name: "Search Insert Position" })).toBeVisible();
  await expect(page.getByText("Solve stage · Apply the pattern")).toBeVisible();
  await expectNoPageOverflow(page);
  await submitSolution(page, INSERT_SOLUTION);
  await expectNoPageOverflow(page);

  const review = page.getByRole("link", { name: "Continue to Review" });
  await expect(review).toBeVisible();
  await review.click();
  await expect(page).toHaveURL(/\/review\?algorithm=binary-search$/);
  await expectNoPageOverflow(page);
  await finishReview(page);

  const firstReward = await page.evaluate(() => {
    const raw = window.localStorage.getItem("algora-progress");
    if (!raw) throw new Error("Progress was not persisted");
    const persisted = JSON.parse(raw) as {
      state: {
        xp: number;
        streak: unknown;
        lessons: Record<string, unknown>;
        reviewCards: Record<string, unknown>;
      };
    };
    return {
      xp: persisted.state.xp,
      streak: persisted.state.streak,
      lessons: persisted.state.lessons,
      card: persisted.state.reviewCards["binary-search"],
    };
  });

  await page.reload();
  await finishReview(page);
  await expect(
    page.getByText("Already reviewed today — this run was practice, so the schedule is unchanged."),
  ).toBeVisible();

  const repeatedReward = await page.evaluate(() => {
    const raw = window.localStorage.getItem("algora-progress");
    if (!raw) throw new Error("Progress was not persisted");
    const persisted = JSON.parse(raw) as {
      state: {
        xp: number;
        streak: unknown;
        lessons: Record<string, unknown>;
        reviewCards: Record<string, unknown>;
      };
    };
    return {
      xp: persisted.state.xp,
      streak: persisted.state.streak,
      lessons: persisted.state.lessons,
      card: persisted.state.reviewCards["binary-search"],
    };
  });
  expect(repeatedReward).toEqual(firstReward);
}

test("Binary Search Golden journey reaches Code, Solve, and truthful Review", async ({ page }) => {
  test.setTimeout(120_000);
  await verifyGoldenJourney(page);
});

test("Binary Search Golden journey remains usable at 320px", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 900 });
  await verifyGoldenJourney(page);
});

test("Binary Search visualizer reflows without desktop shrinking at target widths", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [375, 390, 430, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/algorithms/binary-search");
    const canvas = page.getByTestId("array-canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await expectNoPageOverflow(page);
    await expect(page.locator('[style*="transform: scale("]')).toHaveCount(0);

    const firstCell = canvas.getByTestId("array-cell").first();
    const box = await firstCell.boundingBox();
    expect(box, `${width}px viewport did not render an array cell`).not.toBeNull();
    expect(
      box!.width,
      `${width}px viewport shrank array cells below readable size`,
    ).toBeGreaterThanOrEqual(24);
  }
});
