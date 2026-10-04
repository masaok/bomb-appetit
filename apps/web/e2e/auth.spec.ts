import { expect, test } from "@playwright/test";

// The header only offers sign-in when the deploy has GitHub credentials and a database.
const configured = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && process.env.DATABASE_URL,
);

test("the header sign-in menu sends the player to GitHub", async ({ page }) => {
  test.skip(!configured, "GitHub sign-in is not configured");
  await page.goto("/");
  await page.getByText("Sign in", { exact: true }).click();

  // Stop at GitHub's door: the test proves our half of the handshake without needing an account.
  const authorize = page.waitForRequest((request) =>
    request.url().startsWith("https://github.com/login/oauth/authorize"),
  );
  await page.route("https://github.com/**", (route) => route.abort());
  await page.getByRole("button", { name: "Continue with GitHub" }).click();

  const url = new URL((await authorize).url());
  expect(url.searchParams.get("client_id")).toBe(process.env.AUTH_GITHUB_ID);
  expect(url.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/callback\/github$/);
});

test("the dashboard sends signed-out visitors home", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/$/);
});
