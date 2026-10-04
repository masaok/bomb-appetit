import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

// Tests that need the database check for DATABASE_URL and skip without it.
config({ path: ".env.local", quiet: true });

const port = Number(process.env.E2E_PORT ?? 3210);

// End-to-end tests drive a real dev server, and the room tests need the real database
// and realtime provider. They run on a schedule and on demand, not as a merge gate:
// a red gate caused by the network teaches people to ignore red.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm dev -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
