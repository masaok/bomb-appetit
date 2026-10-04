// Tells the build which implementation of `@bombappetit/cloud` is in `.cloud/`.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** "stub", "path" or "token", as recorded by sync-cloud.mjs. "missing" when it has not run. */
export function cloudSource(appDir) {
  const marker = path.join(appDir, ".cloud", "source.json");
  if (!existsSync(marker)) return "missing";
  return JSON.parse(readFileSync(marker, "utf8")).source;
}

/**
 * Anti-cheat runs inside /api/runs, so a production deploy on the stub would put any
 * valid replay on the leaderboards. Refuse to build one.
 */
export function assertProductionHasCloud(vercelEnv, source) {
  if (vercelEnv === "production" && source !== "path" && source !== "token") {
    throw new Error("Production must build with @bombappetit/cloud. Set BOMBAPPETIT_CLOUD_TOKEN in Vercel.");
  }
}
