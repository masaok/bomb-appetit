import { timingSafeEqual } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimits, rooms } from "@/db/schema";
import { env } from "@/lib/server/env";
import { fail, json, NO_DATABASE } from "@/lib/server/http";

/** Nightly housekeeping, called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  const expected = env.cronSecret ? Buffer.from(`Bearer ${env.cronSecret}`) : null;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  if (!expected || expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return fail(401, "Unauthorized.");
  }
  const db = getDb();
  if (!db) return NO_DATABASE();

  // Runs keep their history: `runs.room_id` is set to null when its room goes.
  const expiredRooms = await db.delete(rooms).where(lt(rooms.expiresAt, new Date())).returning({ id: rooms.id });
  const staleLimits = await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, sql`now() - interval '1 day'`))
    .returning({ key: rateLimits.key });
  return json({ expiredRooms: expiredRooms.length, staleRateLimits: staleLimits.length });
}
