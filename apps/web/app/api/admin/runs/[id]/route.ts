import { z } from "zod";
import { getDb } from "@/db/client";
import { currentAdmin } from "@/lib/server/admin";
import { fail, json, readBody } from "@/lib/server/http";
import { deleteRuns, patchRuns, runPatchSchema } from "@/lib/server/moderation";

async function guard(ctx: RouteContext<"/api/admin/runs/[id]">) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db) return fail(404, "Not found.");
  const id = z.uuid().safeParse((await ctx.params).id);
  return id.success ? { db, id: id.data } : fail(400, "Bad run id.");
}

/** Moderation: put a run on or take it off the leaderboards, or mark it as reviewed. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const ok = await guard(ctx);
  if (ok instanceof Response) return ok;
  const body = await readBody(request, runPatchSchema, 1_000);
  if (body instanceof Response) return body;
  const [row] = await patchRuns(ok.db, [ok.id], body);
  return row ? json({ id: row.id, verified: row.verified }) : fail(404, "No such run.");
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const ok = await guard(ctx);
  if (ok instanceof Response) return ok;
  const [deleted] = await deleteRuns(ok.db, [ok.id]);
  return deleted ? json({ deleted }) : fail(404, "No such run.");
}
