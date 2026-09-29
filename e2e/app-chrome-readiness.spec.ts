import { expect, test } from "@playwright/test";

test("mobile app navigation reaches primary destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/dashboard");

  const trigger = page.getByRole("button", { name: "Open app navigation" });
  await expect(trigger).toBeEnabled({ timeout: 15_000 });
  await trigger.click();
  const navigation = page.getByRole("navigation", { name: "Mobile app navigation" });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Explore" }).click();

  await expect(page).toHaveURL((url) => url.pathname === "/explore");
  await expect(navigation).toBeHidden();
});

test("desktop collapsible sidebar changes width and can be restored", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/leagues");
  await page.evaluate(() => localStorage.removeItem("algora-prefs"));
  await page.reload();

  const sidebar = page.getByRole("complementary", { name: "Sidebar" });
  const collapse = page.getByRole("button", { name: "Collapse sidebar" });
  await expect(collapse).toBeEnabled({ timeout: 15_000 });
  const expandedWidth = (await sidebar.boundingBox())?.width ?? 0;
  await collapse.click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  const collapsedWidth = (await sidebar.boundingBox())?.width ?? 0;
  expect(collapsedWidth).toBeLessThan(expandedWidth);

  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});
