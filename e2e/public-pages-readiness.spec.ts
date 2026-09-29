import { expect, test } from "@playwright/test";

const publicPaths = [
  "/",
  "/visualizer",
  "/pricing",
  "/campus",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
] as const;

for (const width of [390, 1440]) {
  test(`public pages fit ${width}px and have no placeholder links`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const path of publicPaths) {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });

      await page.goto(path);
      await expect(page.locator("main h1").first()).toBeVisible();

      const result = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        placeholderLinks: [...document.querySelectorAll<HTMLAnchorElement>("a")]
          .filter((link) => !link.getAttribute("href") || link.getAttribute("href") === "#")
          .map((link) => link.textContent?.trim()),
      }));

      expect(result.scrollWidth, path).toBeLessThanOrEqual(result.clientWidth + 1);
      expect(result.placeholderLinks, path).toEqual([]);
      expect(errors, path).toEqual([]);
    }
  });
}

test("blog discovery controls filter and recover from an empty result", async ({ page }) => {
  await page.goto("/blog");

  const algorithms = page.getByRole("button", { name: "Algorithms", exact: true });
  await expect(algorithms).toBeEnabled();
  await algorithms.click();
  await expect(algorithms).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "A visual guide to Dijkstra" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "DFS vs BFS: when to use which" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Master recursion with the call stack" }),
  ).toHaveCount(0);

  await page.getByRole("textbox", { name: "Search articles" }).fill("no-such-article");
  await expect(page.getByText("No article previews match this search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Master recursion with the call stack" }),
  ).toBeVisible();
});

test("campus actions lead to the real inquiry form", async ({ page }) => {
  await page.goto("/campus");
  const request = page.getByRole("link", { name: "Request campus access" }).first();
  await expect(request).toHaveAttribute("href", "/contact#contact-form");
  await request.click();
  await expect(page).toHaveURL(/\/contact#contact-form$/);
  await expect(page.locator("#contact-form")).toBeVisible();
});

test("legal pages disclose preview status without invented service guarantees", async ({
  page,
}) => {
  for (const path of ["/privacy", "/terms"] as const) {
    await page.goto(path);
    const body = await page.locator("main").innerText();
    expect(body).toContain("preview");
    expect(body).not.toContain("Stripe");
    expect(body).not.toContain("99.9%");
    expect(body).not.toContain("14-DAY GUARANTEE");
    expect(body).not.toContain("24h cloud erasure");
  }
});
