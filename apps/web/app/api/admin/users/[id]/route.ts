import { z } from "zod";
import { getDb } from "@/db/client";
import { currentAdmin } from "@/lib/server/admin";
import { fail, json, readBody } from "@/lib/server/http";
import { setRanked } from "@/lib/server/moderation";

/**
 * Moderation: take a user off every leaderboard, or put them back. Their runs and their
 * mission progress are untouched, so the change is undone by sending the opposite value.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db) return fail(404, "Not found.");
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return fail(400, "Bad user id.");
  const body = await readBody(request, z.object({ ranked: z.boolean() }), 1_000);
  if (body instanceof Response) return body;

  const [row] = await setRanked(db, [id.data], body.ranked);
  return row ? json(row) : fail(404, "No such user.");
}
