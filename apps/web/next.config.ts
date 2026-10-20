import path from "node:path";
import type { NextConfig } from "next";
import { assertProductionHasCloud, cloudSource } from "./scripts/cloud-source.mjs";

// scripts/sync-cloud.mjs fills `.cloud/` before every dev and build run and records
// whether it holds the private package or the public stub.
const source = cloudSource(process.cwd());
assertProductionHasCloud(process.env.VERCEL_ENV, source);

const isDev = process.env.NODE_ENV !== "production";

// The cloud package sets a Google Analytics id (see app/layout.tsx). The stub sets none,
// so a self-hosted build keeps a CSP with no Google origins.
const ga = source === "path" || source === "token";
const gaScript = ga ? " https://www.googletagmanager.com" : "";
// GA4 also beacons to www.google.com and doubleclick when Google signals is on.
const gaConnect = ga
  ? " https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://*.g.doubleclick.net"
  : "";

// Next.js needs inline scripts for hydration data. Nonces would force every page,
// including the static marketing pages, to render per request, so inline is allowed
// and everything else is locked to this origin plus the realtime provider.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${gaScript}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://avatars.githubusercontent.com${gaConnect}`,
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  `connect-src 'self' https://*.pusher.com wss://*.pusher.com${gaConnect}`,
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
  // A post's Markdown copy lives at /blog/<slug>.md
  async rewrites() {
    return [{ source: "/blog/:slug.md", destination: "/blog/md/:slug" }];
  },
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
