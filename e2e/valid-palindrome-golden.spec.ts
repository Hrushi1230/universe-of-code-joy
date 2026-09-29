import { expect, test, type Page } from "@playwright/test";

const PALINDROME_URL = "/algorithms/two-pointers?problem=valid-palindrome";

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

test("Valid Palindrome golden slice stays fixed and requires prediction", async ({ page }) => {
  await page.goto(PALINDROME_URL);

  await expect(page.getByRole("heading", { name: "Valid Palindrome" })).toBeVisible();
  await expect(page.getByTestId("array-canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("array-cell")).toHaveCount(11);
  await expect(page.getByText("␠", { exact: true })).toBeVisible();
  await expect(page.locator("code")).toHaveCount(12);
  await expect(page.locator("code").last()).toHaveText("}");
  await expect(page.getByText("palindrome =")).toBeVisible();
  await expectFrozenViewport(page);

  const stages = page.getByRole("navigation", { name: "Lesson stages" });
  await expect(stages.getByRole("link", { name: "Code" })).toHaveAttribute(
    "href",
    /\/practice\/valid-palindrome\?.*problem=valid-palindrome.*stage=code/,
  );
  await expect(stages.getByRole("link", { name: "Solve" })).toHaveAttribute(
    "href",
    /\/practice\/move-zeroes\?.*problem=valid-palindrome.*stage=solve/,
  );
  await expect(stages.getByRole("link", { name: "Review" })).toHaveAttribute(
    "href",
    /\/review\?algorithm=two-pointers&problem=valid-palindrome/,
  );

  await page
    .getByRole("region", { name: "Playback" })
    .getByRole("button", { name: "Next step (→)" })
    .click();

  const prediction = page.locator("[data-prediction-gate]");
  await expect(page.getByText("Prediction checkpoint — Your turn")).toBeVisible();
  await expect(prediction.getByRole("radio")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Answer the prediction to continue" }),
  ).toHaveAttribute("aria-disabled", "true");

  await prediction.getByRole("radio", { name: "left++; right--", exact: true }).check();
  await prediction.getByRole("button", { name: "Check answer" }).click();
  await expect(prediction.getByRole("button", { name: "Continue" })).toBeVisible();
  await prediction.getByRole("button", { name: "Continue" }).click();
  await expectFrozenViewport(page);

  await stages.getByRole("link", { name: "Trace" }).click();
  await expect(page.getByRole("heading", { name: "Trace it yourself" })).toBeVisible();
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Trace it yourself" }).getByRole("radio"),
  ).toHaveCount(4);
  await expectFrozenViewport(page);
});

test("Valid Palindrome maximum input keeps all characters and controls visible", async ({
  page,
}) => {
  const input = Buffer.from(JSON.stringify({ text: "A1,b2!!2b,1A" }), "utf8").toString("base64");

  await page.goto(`${PALINDROME_URL}&input=${encodeURIComponent(input)}&step=999`);

  await expect(page.getByTestId("array-cell")).toHaveCount(12);
  await expect(page.getByText("Step 16 of 16")).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay (Space)" })).toBeVisible();
  await expect(
    page.getByText("The pointers met or crossed without finding a mismatched pair.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("palindrome = true")).toBeVisible();

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
