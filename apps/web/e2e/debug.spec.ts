import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

// Every module's face, driven in a real browser to a full defusal through the same
// dispatch path the Defuser uses. Catches a face that crashes on some state.
test("a bomb with all 14 modules renders and can be defused with no console errors", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await page.goto("/debug?modules=11&needy=3&time=1200&seed=5");
  const summary = page.getByTestId("debug-summary");
  await expect(summary).toContainText('"result":"abandoned"');

  for (let step = 0; step < 600; step++) {
    if ((await summary.innerText()).includes('"result":"defused"')) break;
    const action = page.locator('[data-testid^="do-"]').first();
    if (await action.isVisible()) await action.click();
    else await page.waitForTimeout(150);
  }

  await expect(summary).toContainText('"result":"defused"');
  await expect(summary).toContainText('"strikes":0');
  expect(errors).toEqual([]);
});
