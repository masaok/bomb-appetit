import "server-only";
import { randomBytes } from "node:crypto";

const isProduction = process.env.NODE_ENV === "production";

let devSecret: string | null = null;

/** Signs guest cookies and run tickets. A throwaway secret is fine in development only. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (isProduction) throw new Error("AUTH_SECRET must be set to at least 32 characters in production");
  devSecret ??= randomBytes(32).toString("hex");
  return devSecret;
}

/**
 * Lets a developer open the admin pages without signing in. It needs all three: a
 * development server (`next dev`), not running on Vercel, and `DEV_ADMIN_BYPASS=1`.
 * A production build ignores the variable, so setting it on a deployment does nothing.
 * Read at call time, so the test can show each condition switching it off.
 */
export function devAdminBypass(): boolean {
  return (
    process.env.NODE_ENV === "development" && !process.env.VERCEL && process.env.DEV_ADMIN_BYPASS === "1"
  );
}

export const env = {
  isProduction,
  databaseUrl: process.env.DATABASE_URL || null,
  githubAuth:
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? { clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }
      : null,
  pusher:
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_SECRET &&
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
      ? {
          appId: process.env.PUSHER_APP_ID,
          secret: process.env.PUSHER_SECRET,
          key: process.env.NEXT_PUBLIC_PUSHER_KEY,
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        }
      : null,
  cronSecret: process.env.CRON_SECRET || null,
};
