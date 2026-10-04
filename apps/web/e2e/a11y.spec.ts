import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// axe-core is the engine behind Lighthouse's accessibility score. Zero violations
// here is a stricter bar than a score of 95.
for (const path of ["/", "/play", "/missions", "/how-to-play", "/faq", "/manual/1", "/manual/2026"]) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.html.slice(0, 120)}`,
      ),
    ).toEqual([]);
  });
}

test("the bomb screen has no accessibility violations", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ba:view", "2d"));
  await page.goto("/debug?modules=11&needy=3&seed=5");
  await expect(page.getByLabel("Edgework")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.html.slice(0, 120)}`),
  ).toEqual([]);
});
