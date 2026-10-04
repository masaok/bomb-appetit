import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { currentAdmin } from "@/lib/server/admin";
import { expireAllBoards } from "@/lib/server/board-cache";
import { fail, json, readBody } from "@/lib/server/http";

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

  const [row] = await db
    .update(users)
    .set({ ranked: body.ranked })
    .where(eq(users.id, id.data))
    .returning({ id: users.id, ranked: users.ranked });
  if (!row) return fail(404, "No such user.");
  expireAllBoards();
  return json(row);
}
