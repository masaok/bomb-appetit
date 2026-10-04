import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { runs } from "@/db/schema";
import { currentAdmin } from "@/lib/server/admin";
import { fail, json, readBody } from "@/lib/server/http";

async function guard(ctx: RouteContext<"/api/admin/runs/[id]">) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db) return fail(404, "Not found.");
  const id = z.uuid().safeParse((await ctx.params).id);
  return id.success ? { db, id: id.data } : fail(400, "Bad run id.");
}

/** Moderation: put a run on or take it off the leaderboards. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const ok = await guard(ctx);
  if (ok instanceof Response) return ok;
  const body = await readBody(request, z.object({ verified: z.boolean() }), 1_000);
  if (body instanceof Response) return body;
  const [row] = await ok.db
    .update(runs)
    .set({ verified: body.verified })
    .where(eq(runs.id, ok.id))
    .returning({ id: runs.id });
  return row ? json({ id: row.id, verified: body.verified }) : fail(404, "No such run.");
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const ok = await guard(ctx);
  if (ok instanceof Response) return ok;
  const [row] = await ok.db.delete(runs).where(eq(runs.id, ok.id)).returning({ id: runs.id });
  return row ? json({ deleted: row.id }) : fail(404, "No such run.");
}
