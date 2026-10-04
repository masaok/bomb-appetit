import { expect, test } from "@playwright/test";
import { hasDatabase, solveWires, trackErrors } from "./helpers";

test.skip(!hasDatabase, "Rooms need DATABASE_URL (run `pnpm env:write` in the private repo).");

test("a Defuser and two Experts on separate devices play a room game to a verified result", async ({
  browser,
}) => {
  const defuserContext = await browser.newContext();
  const defuser = await defuserContext.newPage();
  await defuser.addInitScript(() => localStorage.setItem("ba:view", "2d"));
  const errors = trackErrors(defuser);

  await defuser.goto("/play");
  await defuser.getByLabel("Your name").fill("Dee Fuser");
  await defuser.getByRole("button", { name: "Create a room" }).click();
  await defuser.waitForURL(/\/r\/[A-Z]{5}$/);
  const code = defuser.url().slice(-5);

  const experts = [];
  for (const name of ["Ex Pert", "Second Opinion"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/r/${code}`);
    await page.getByLabel("Your name").fill(name);
    await page.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Waiting for the host to arm the bomb.")).toBeVisible();
    experts.push({ page, context });
  }

  await expect(defuser.getByText("Ex Pert")).toBeVisible({ timeout: 15_000 });
  await expect(defuser.getByText("Second Opinion")).toBeVisible({ timeout: 15_000 });
  await defuser.getByLabel("What to play").selectOption({ label: "1.1 First bite" });
  await expect(defuser.getByText("Experts will use manual 1")).toBeVisible();
  await defuser.getByRole("button", { name: "Arm the bomb" }).click();

  // The Defuser gets the bomb. Experts get the status bar and the manual, never the bomb.
  await expect(defuser.getByRole("group", { name: "Wires" })).toBeVisible({ timeout: 15_000 });
  for (const { page } of experts) {
    const bar = page.getByRole("status", { name: "Bomb status" });
    await expect(bar).toBeVisible({ timeout: 15_000 });
    await expect(bar).toContainText("Solved 0/1");
    await expect(
      page.frameLocator("iframe").getByRole("heading", { name: "Bomb defusal manual" }),
    ).toBeVisible();
    await expect(page.getByRole("group", { name: "Wires" })).toHaveCount(0);
    const view = await (await page.request.get(`/api/rooms/${code}`)).json();
    expect(view.defuser, "an Expert's room view must not carry the bomb").toBeNull();
    expect(JSON.stringify(view)).not.toContain("bombSeed");
  }

  await defuser.waitForTimeout(3_500);
  await solveWires(defuser, 1);

  for (const page of [defuser, ...experts.map((e) => e.page)]) {
    await expect(page.getByText("Last game")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Defused with \d:\d\d left/)).toBeVisible();
    await expect(page.getByText("verified by server replay")).toBeVisible();
  }
  expect(errors).toEqual([]);

  await defuserContext.close();
  for (const { context } of experts) await context.close();
});

test("a second player cannot take the Defuser seat while it is taken", async ({ browser }) => {
  const host = await (await browser.newContext()).newPage();
  await host.goto("/play");
  await host.getByLabel("Your name").fill("Host");
  await host.getByRole("button", { name: "Create a room" }).click();
  await host.waitForURL(/\/r\/[A-Z]{5}$/);
  const code = host.url().slice(-5);

  const guest = await (await browser.newContext()).newPage();
  await guest.goto(`/r/${code}`);
  await guest.getByLabel("Your name").fill("Guest");
  await guest.getByRole("button", { name: "Join" }).click();
  await expect(guest.getByRole("button", { name: "Host is the Defuser" })).toBeDisabled();

  const response = await guest.request.post(`/api/rooms/${code}`, { data: { op: "role", role: "defuser" } });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toBe("Someone else is already the Defuser.");
});
