import type { CloudModule } from "./cloud-contract";

/**
 * Stand-in for the private `@bombappetit/cloud` package. It accepts every run that
 * replays correctly and serves the CC0 assets, so a fresh clone runs the whole game
 * with no secrets. Production must never deploy with this (see next.config.ts).
 */
const stub: CloudModule = {
  name: "stub",
  verifyRunPlausibility: () => ({ plausible: true }),
  assetManifest: {},
  AdminApp: () => (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-display text-3xl font-semibold">Admin is not included in this build</h1>
      <p className="mt-3 text-muted">
        The admin pages ship in the private cloud package. This build uses the public stub.
      </p>
    </main>
  ),
};

export default stub;
