import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// scripts/sync-cloud.mjs fills `.cloud/` before every dev and build run and records
// whether it holds the private package or the public stub.
const marker = path.join(process.cwd(), ".cloud", "source.json");
const hasCloud = existsSync(marker) && JSON.parse(readFileSync(marker, "utf8")).source !== "stub";

// Anti-cheat runs inside /api/runs, so a production deploy on the stub would accept
// any valid replay onto the leaderboards. Fail the build instead.
if (process.env.VERCEL_ENV === "production" && !hasCloud) {
  throw new Error("Production must build with @bombappetit/cloud. Set BOMBAPPETIT_CLOUD_TOKEN.");
}

const isDev = process.env.NODE_ENV !== "production";

// Next.js needs inline scripts for hydration data. Nonces would force every page,
// including the static marketing site, to render per request, so inline is allowed
// and everything else is locked to this origin plus the realtime provider.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.pusher.com wss://*.pusher.com",
  "form-action 'self' https://github.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd(), "..", ".."),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
