import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";
import { clientIp, fail } from "./http";

const memory = new Map<string, { windowStart: number; count: number }>();

async function hit(key: string, windowSeconds: number): Promise<number> {
  const db = getDb();
  if (!db) {
    const now = Date.now();
    const entry = memory.get(key);
    if (!entry || now - entry.windowStart > windowSeconds * 1000) {
      memory.set(key, { windowStart: now, count: 1 });
      return 1;
    }
    return ++entry.count;
  }
  const expired = sql`${rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds})`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return row?.count ?? 1;
}

/** Returns a 429 response when `scope` was hit more than `limit` times from this address in the window. */
export async function rateLimited(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds = 60,
): Promise<Response | null> {
  const count = await hit(`${scope}:${clientIp(request)}`, windowSeconds);
  return count > limit ? fail(429, "Too many requests. Wait a moment and try again.") : null;
}
