// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentAdmin } from "./admin";

// Nobody is signed in, so only the bypass can produce an admin.
vi.mock("@/auth", () => ({
  signInAvailable: () => true,
  auth: async () => null,
  isAdmin: async () => false,
}));

function withEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
}

afterEach(() => vi.unstubAllEnvs());

describe("the development admin bypass", () => {
  it("opens the admin pages under a development server with the flag set", async () => {
    withEnv({ NODE_ENV: "development", VERCEL: undefined, DEV_ADMIN_BYPASS: "1" });
    expect(await currentAdmin()).toMatchObject({ name: "Dev admin (bypass)" });
  });

  it("is off without the flag, and for any value but 1", async () => {
    withEnv({ NODE_ENV: "development", VERCEL: undefined, DEV_ADMIN_BYPASS: undefined });
    expect(await currentAdmin()).toBeNull();
    withEnv({ DEV_ADMIN_BYPASS: "true" });
    expect(await currentAdmin()).toBeNull();
  });

  it("is off in a production build, even with the flag set", async () => {
    withEnv({ NODE_ENV: "production", VERCEL: undefined, DEV_ADMIN_BYPASS: "1" });
    expect(await currentAdmin()).toBeNull();
  });

  it("is off under test, and on Vercel in any environment", async () => {
    withEnv({ NODE_ENV: "test", VERCEL: undefined, DEV_ADMIN_BYPASS: "1" });
    expect(await currentAdmin()).toBeNull();
    withEnv({ NODE_ENV: "development", VERCEL: "1", DEV_ADMIN_BYPASS: "1" });
    expect(await currentAdmin()).toBeNull();
  });
});
