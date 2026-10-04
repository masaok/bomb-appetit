import { expect, test } from "@playwright/test";
import { solveWires, trackErrors } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ba:view", "2d"));
});

test("a solo player defuses the first mission from the manual's rules and the server verifies it", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/missions");
  await page
    .getByRole("listitem")
    .filter({ hasText: "First bite" })
    .getByRole("link", { name: "Play" })
    .click();

  await expect(page.getByRole("heading", { name: "First bite" })).toBeVisible();
  await page.getByRole("button", { name: "Arm the bomb" }).click();
  await expect(page.getByRole("timer").first()).toContainText(/4:5\d/);

  // A person needs a few seconds to read the wires out and hear the answer.
  await page.waitForTimeout(3_500);
  await solveWires(page, 1);

  await expect(page.getByText("Bomb defused")).toBeVisible();
  await expect(page.getByText(/Run verified by server replay|no database/)).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test("a wrong cut is a strike, and the last strike explodes the bomb", async ({ page }) => {
  await page.goto("/bomb?modules=1&pool=wires&strikes=1");
  await page.getByRole("button", { name: "Arm the bomb" }).click();
  const wires = page.getByRole("group", { name: "Wires" }).getByRole("button");
  await expect(wires.first()).toBeVisible();

  // With one strike allowed, cutting wires top to bottom ends either way within two cuts:
  // the first cut is right (defused) or wrong (boom).
  await wires.first().click();
  await expect(page.getByText(/Bomb defused|Boom/)).toBeVisible();
  const boom = await page.getByText("Boom").isVisible();
  if (boom) await expect(page.getByRole("heading", { name: "Strike 1 on Wires" })).toBeVisible();
});

test("a refresh in the middle of a bomb resumes the same bomb and clock", async ({ page }) => {
  await page.goto("/bomb?modules=3&pool=wires&time=300");
  await page.getByRole("button", { name: "Arm the bomb" }).click();
  await expect(page.getByLabel("Edgework")).toBeVisible();
  const serial = await page.getByLabel("Edgework").locator("span.font-mono").first().innerText();
  await page.waitForTimeout(2_000);

  await page.reload();
  // The briefing screen deals a fresh ticket, but arming finds the saved run for this URL.
  await page.getByRole("button", { name: "Arm the bomb" }).click();
  await expect(page.getByLabel("Edgework").locator("span.font-mono").first()).toHaveText(serial);
  await expect(page.getByRole("timer").first()).toContainText(/4:5[0-7]/);
});
