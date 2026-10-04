import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

const MODULES = [
  "Wires",
  "Big Button",
  "Glyph Keypad",
  "Color Echo",
  "Word Grid",
  "Recall",
  "Blinker",
  "Tangled Wires",
  "Wire Panels",
  "Labyrinth",
  "Passcode",
  "Pressure Vent",
  "Discharge Lever",
  "Dial Alignment",
];

test("the standard manual has a section for every module and filters its index", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/manual/1");
  for (const name of MODULES) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  }

  await page.keyboard.press("/");
  await page.keyboard.type("laby");
  const index = page.getByRole("navigation", { name: "Manual sections" });
  await expect(index.getByRole("link")).toHaveText(["Labyrinth"]);
  expect(errors).toEqual([]);
});

test("a different rule seed prints a different manual", async ({ page }) => {
  await page.goto("/manual/1");
  const standard = await page.locator("#wires").innerText();
  await page.goto("/manual/2026");
  await expect(page.getByText("manual 2026")).toBeVisible();
  expect(await page.locator("#wires").innerText()).not.toBe(standard);
});

test("printing hides the tools and starts each module on its own page", async ({ page }) => {
  await page.goto("/manual/1");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("navigation", { name: "Manual sections" })).toBeHidden();
  const breakBefore = await page.locator("#big-button").evaluate((el) => getComputedStyle(el).breakBefore);
  expect(breakBefore).toBe("page");
});

test("an out-of-range rule seed is a 404", async ({ page }) => {
  const response = await page.goto("/manual/0");
  expect(response?.status()).toBe(404);
});
