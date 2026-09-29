import { expect, test, type Page } from "@playwright/test";

async function seedLocalProgress(page: Page, patch: Record<string, unknown> = {}): Promise<void> {
  await page.goto("/");
  await page.evaluate((statePatch) => {
    const base = {
      xp: 0,
      level: 1,
      streak: { current: 0, longest: 0, lastActiveISO: null, freezesLeft: 2 },
      algorithms: {},
      lessons: {},
      problems: {},
      reviewCards: {},
      quests: {},
      achievements: {},
      rewardTransactions: {},
      activity: {},
      bookmarks: [],
      activePathSlug: null,
    };
    localStorage.setItem(
      "algora-progress",
      JSON.stringify({ state: { ...base, ...statePatch }, version: 4 }),
    );
  }, patch);
}

test("P5 routes reflow at phone and desktop widths without document overflow", async ({ page }) => {
  const routes = [
    "/quests",
    "/achievements",
    "/leagues",
    "/notifications",
    "/settings/",
    "/settings/billing",
  ];

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), {
          message: `${route} at ${width}px`,
        })
        .toBeLessThanOrEqual(1);
    }
  }
});

test("quest and shop rewards are credited once and survive reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const today = await page.evaluate(() => {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });
  await seedLocalProgress(page, {
    xp: 400,
    level: 1,
    activity: { [today]: { xp: 0, minutes: 0, steps: 0, solved: 2 } },
  });

  await page.goto("/quests");
  const quest = page.getByTestId("quest-daily-problems");
  await expect(quest.getByRole("button", { name: "Claim" })).toBeEnabled({ timeout: 15_000 });
  await quest.getByRole("button", { name: "Claim" }).click();
  await expect(quest.getByRole("button", { name: "Claimed" })).toBeDisabled();
  await page.reload();
  await expect(
    page.getByTestId("quest-daily-problems").getByRole("button", { name: "Claimed" }),
  ).toBeDisabled();

  let stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("algora-progress")!).state,
  );
  expect(stored.xp).toBe(430);
  expect(
    Object.keys(stored.rewardTransactions).filter((id) => id.startsWith("quest:")),
  ).toHaveLength(1);

  await page.goto("/achievements");
  await page.getByRole("button", { name: "Redeem" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("cannot be undone");
  await page.getByRole("button", { name: "Spend XP" }).click();
  await page.reload();

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem("algora-progress")!).state);
  expect(stored.xp).toBe(230);
  expect(stored.streak.freezesLeft).toBe(3);
  expect(
    Object.keys(stored.rewardTransactions).filter((id) => id.startsWith("shop:")),
  ).toHaveLength(1);
});

test("local activity read state and notification preference drafts persist", async ({ page }) => {
  const solvedAt = new Date().toISOString();
  await seedLocalProgress(page, {
    problems: {
      "two-sum": {
        attempts: 1,
        solvedAt,
        bestRuntimeMs: 14,
        lastCode: { js: "", ts: "", py: "" },
      },
    },
  });

  await page.goto("/notifications");
  await expect(page.getByText(/Two Sum II.*solved/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("1 unread")).toBeVisible();
  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(page.getByText("0 unread")).toBeVisible();

  const toggle = page.getByRole("switch", { name: "Streak reminders email preference" });
  const before = await toggle.getAttribute("aria-checked");
  await toggle.click();
  await page.getByRole("button", { name: "Save locally" }).click();
  await page.reload();
  await expect(page.getByText("0 unread")).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Streak reminders email preference" }),
  ).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
});

test("settings validates and restores the local identity; league and billing stay truthful", async ({
  page,
}) => {
  await page.goto("/settings/");
  const name = page.getByLabel("Full name");
  await name.fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Enter at least 2 characters.")).toBeVisible();

  await name.fill("Ada Lovelace");
  await page.getByLabel("Username").fill("@ada_1");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Ada Lovelace");
  await expect(page.getByText("Two-factor authentication")).toBeVisible();
  await expect(page.getByText("Not connected").first()).toBeVisible();

  await page.goto("/leagues");
  await expect(page.getByText("Ada Lovelace")).toBeVisible();
  await expect(page.getByText(/deterministic fixture/)).toBeVisible();

  await page.goto("/settings/billing");
  await expect(page.getByText("No card or billing profile stored")).toBeVisible();
  await expect(page.getByText("No invoice records available")).toBeVisible();
  await expect(page.getByText("•••• 4242")).toHaveCount(0);
});
