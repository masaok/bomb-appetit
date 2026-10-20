import Link from "next/link";
import { GITHUB_URL } from "@/components/site/links";
import type { CloudModule } from "./cloud-contract";

/**
 * Stand-in for the private `@bombappetit/cloud` package. It accepts every run that
 * replays correctly and serves the CC0 assets, so a fresh clone runs the whole game
 * with no secrets. The marketing site is private, so `/` is a plain start page and the
 * other marketing routes are 404s. Production must never deploy with this (see next.config.ts).
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
  marketing: {
    "/": {
      metadata: { title: { absolute: "Bomb Appétit" } },
      Page: () => (
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <h1 className="font-display text-5xl font-bold">Bomb Appétit</h1>
          <p className="mt-3 text-lg text-muted">A co-op bomb defusal game for the browser.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/play"
              className="sticker sticker-press rounded-full bg-tomato px-7 py-3 font-display text-lg font-semibold text-white"
            >
              Play
            </Link>
            <a
              href={GITHUB_URL}
              className="sticker sticker-press rounded-full bg-card px-7 py-3 font-display text-lg font-semibold"
            >
              GitHub
            </a>
          </div>
        </div>
      ),
    },
    "/faq": null,
    "/how-to-play": null,
    "/press": null,
    "/changelog": null,
  },
  gaId: null,
};

export default stub;
