import { ruleBook } from "@bombappetit/engine";
import { wireToCut, type WireColor } from "@bombappetit/engine/modules/wires";
import { expect, type Page } from "@playwright/test";

/** Collects console and page errors so a test can assert the session stayed clean. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/**
 * Solves the Wires module the way an Expert would: from what is visible on the bomb
 * (wire colors, serial number) and the manual's rules for this rule seed.
 */
export async function solveWires(page: Page, ruleSeed: number) {
  const face = page.getByRole("group", { name: "Wires" });
  await expect(face).toBeVisible();
  const labels = await face
    .getByRole("button")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("aria-label") ?? ""));
  const colors = labels.map((label) => label.split(", ")[1]!.toLowerCase() as WireColor);
  const serial = (await page.getByLabel("Edgework").locator("span.font-mono").first().innerText()).trim();
  const serialOdd = Number(serial.at(-1)) % 2 === 1;

  const index = wireToCut(ruleBook(ruleSeed).wires, colors, serialOdd);
  expect(
    index,
    `manual ${ruleSeed} must name a wire for ${colors.join(",")} / ${serial}`,
  ).toBeGreaterThanOrEqual(0);
  await face.getByRole("button").nth(index).click();
}

export const hasDatabase = Boolean(process.env.DATABASE_URL);
