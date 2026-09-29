import { expect, test, type ConsoleMessage } from "@playwright/test";

const discoveryPaths = [
  "/explore",
  "/paths",
  "/mastery-map",
  "/dashboard",
  "/onboarding/goals",
  "/onboarding/assessment",
  "/onboarding/path",
  "/auth",
  "/login",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;

for (const width of [390, 1440]) {
  test(`discovery and onboarding routes fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const path of discoveryPaths) {
      const errors: string[] = [];
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() === "error") errors.push(message.text());
      };
      page.on("console", onConsole);
      await page.goto(path);
      await expect(page.locator("main h1").first()).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth, path).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      expect(errors, path).toEqual([]);
      page.off("console", onConsole);
    }
  });
}

test("explore search survives navigation, back, and reload", async ({ page }) => {
  await page.goto("/explore");
  const search = page.getByRole("searchbox", { name: "Search algorithms" });
  await search.fill("dijkstra");
  await expect(page).toHaveURL(/q=dijkstra/);
  await expect(page.getByRole("heading", { name: "Dijkstra's Algorithm" }).first()).toBeVisible();

  await page
    .getByRole("link", { name: /Dijkstra's Algorithm/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/algorithms\/dijkstra/);
  await page.goBack();
  await expect(page).toHaveURL(/q=dijkstra/);
  await expect(search).toHaveValue("dijkstra");

  await page.reload();
  await expect(search).toHaveValue("dijkstra");
  await expect(page.getByRole("heading", { name: "Dijkstra's Algorithm" }).first()).toBeVisible();
});

test("a learner's onboarding choices produce and retain a real path", async ({ page }) => {
  await page.goto("/onboarding/goals");
  await page.evaluate(() => localStorage.removeItem("algora-onboarding"));
  await page.reload();

  await page.getByRole("button", { name: /Interview prep/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/onboarding\/assessment$/);

  for (const answer of ["A", "B", "C"]) {
    await page.getByRole("button", { name: new RegExp(`^${answer} `) }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByRole("status")).toContainText("Correct.");
    await page
      .getByRole("button", { name: answer === "C" ? "See recommendation" : "Next question" })
      .click();
  }

  await expect(page).toHaveURL(/\/onboarding\/path$/);
  await expect(
    page.getByRole("heading", { name: /recommended path: Interview Prep/ }),
  ).toBeVisible();
  await expect(page.getByText("6 weeks")).toBeVisible();
  await expect(page.getByText("19 catalog algorithms")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: /recommended path: Interview Prep/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retake diagnostic" }).click();
  await expect(page.getByRole("heading", { name: "Which node is visited first?" })).toBeVisible();
  await page.getByRole("button", { name: "Skip assessment" }).click();
  await expect(
    page.getByRole("heading", { name: /recommended path: Interview Prep/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start learning" }).click();
  await expect(page).toHaveURL(/\/algorithms\/two-pointers/);

  const storedPath = await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("algora-progress") || "{}");
    return value.state?.activePathSlug;
  });
  expect(storedPath).toBe("interview-prep");
});

test("path selection is locally persisted and visibly restored", async ({ page }) => {
  await page.goto("/paths");
  await page.evaluate(() => localStorage.removeItem("algora-progress"));
  await page.reload();

  const interviewCard = page.getByTestId("path-card-interview-prep");
  const start = interviewCard.getByRole("button", { name: "Start path" });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page).toHaveURL(/\/algorithms\/two-pointers/);

  await page.goto("/paths");
  await expect(interviewCard.getByText("Current path")).toBeVisible();
  await expect(interviewCard.getByRole("button", { name: "Start path" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("dashboard restores the learner's local identity and onboarding pace", async ({ page }) => {
  await page.goto("/dashboard");
  await page.evaluate(() => {
    localStorage.setItem(
      "algora-prefs",
      JSON.stringify({
        version: 3,
        state: {
          profile: {
            fullName: "Ada Lovelace",
            username: "@ada",
            email: "ada@example.com",
            country: "",
            bio: "",
            twoFactorEnabled: false,
          },
        },
      }),
    );
    localStorage.setItem(
      "algora-onboarding",
      JSON.stringify({
        goals: ["interview"],
        commitment: "casual",
        level: "beginner",
        assessmentAnswers: [],
        assessmentScore: null,
        assessmentTotal: 3,
        assessmentSkipped: true,
        recommendedPathSlug: "interview-prep",
      }),
    );
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: /Welcome back, Ada/ })).toBeVisible();
  await expect(page.getByText("This week · 0.0 / 1.5h")).toBeVisible();
  await expect(page.getByText("Ada L.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Welcome back, Ada/ })).toBeVisible();
});

test("mastery map exposes a keyboard list without pretending skills are blocked", async ({
  page,
}) => {
  await page.goto("/mastery-map");
  await expect(page.getByText("Locked", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /All skills · keyboard list/ })).toBeVisible();
  const dijkstra = page.getByRole("link", { name: /Dijkstra's Algorithm/ });
  await expect(dijkstra).toBeVisible();
  await dijkstra.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/algorithms\/dijkstra/);
});
