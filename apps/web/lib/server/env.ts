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
