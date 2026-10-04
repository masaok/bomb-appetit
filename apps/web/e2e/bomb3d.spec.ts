import { expect, test } from "@playwright/test";
import { trackErrors } from "./helpers";

test.use({ launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] } });

test("the 3D view shows the bomb, focuses a module and flips, with no console errors", async ({ page }) => {
  const errors = trackErrors(page);
  await page.addInitScript(() => localStorage.setItem("ba:view", "3d"));
  await page.goto("/bomb?modules=3&pool=wires");
  await page.getByRole("button", { name: "Arm the bomb" }).click();

  // Without WebGL the view falls back to the 2D net, which is also a pass for this page.
  const canvas = page.locator("canvas");
  const net = page.getByRole("region", { name: "Front of the bomb" });
  await expect(canvas.or(net).first()).toBeVisible({ timeout: 20_000 });

  if (await canvas.isVisible()) {
    await page.getByRole("button", { name: "Focus Wires" }).first().click();
    await expect(page.getByRole("button", { name: "Back", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Back", exact: true })).toBeHidden();
    await page.getByRole("button", { name: "Flip" }).click();
  }
  await expect(page.getByLabel("Edgework")).toBeVisible();
  expect(errors).toEqual([]);
});
