import path from "node:path";
import type { NextConfig } from "next";
import { assertProductionHasCloud, cloudSource } from "./scripts/cloud-source.mjs";

// scripts/sync-cloud.mjs fills `.cloud/` before every dev and build run and records
// whether it holds the private package or the public stub.
assertProductionHasCloud(process.env.VERCEL_ENV, cloudSource(process.cwd()));

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
  "frame-src 'self'",
  // The room page shows the manual to Experts in a same-origin frame.
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd(), "..", ".."),
  },
  poweredByHeader: false,
  // The dev tools bubble sits over the bomb's corner. Compile and runtime errors still show.
  devIndicators: false,
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
