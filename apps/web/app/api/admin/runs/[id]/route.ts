import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, type Db } from "@/db/client";
import { runs } from "@/db/schema";
import { currentAdmin } from "@/lib/server/admin";
import { expireBoard } from "@/lib/server/board-cache";
import { fail, json, readBody } from "@/lib/server/http";
import { refreshProgress } from "@/lib/server/progress";

async function guard(ctx: RouteContext<"/api/admin/runs/[id]">) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db) return fail(404, "Not found.");
  const id = z.uuid().safeParse((await ctx.params).id);
  return id.success ? { db, id: id.data } : fail(400, "Bad run id.");
}

const affected = { id: runs.id, defuserId: runs.defuserId, missionId: runs.missionId };

/** A moderated run can change its player's best time and its mission's board. Bring both up to date. */
async function settle(db: Db, run: { defuserId: string | null; missionId: string | null }) {
  if (run.defuserId && run.missionId) await refreshProgress(db, run.defuserId, run.missionId);
  expireBoard(run.missionId);
}

const patchSchema = z
  .object({
    /** Puts the run on, or takes it off, the leaderboards. */
    verified: z.boolean().optional(),
    /** Clears the run's review reasons: an admin has looked at it. */
    reviewed: z.literal(true).optional(),
  })
  .refine((body) => body.verified !== undefined || body.reviewed, "Nothing to change.");

/** Moderation: put a run on or take it off the leaderboards, or mark it as reviewed. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const ok = await guard(ctx);
  if (ok instanceof Response) return ok;
  const body = await readBody(request, patchSchema, 1_000);
  if (body instanceof Response) return body;
  const [row] = await ok.db
    .update(runs)
    .set({
      ...(body.verified === undefined ? {} : { verified: body.verified }),
      ...(body.reviewed ? { review: [] } : {}),
    })
    .where(eq(runs.id, ok.id))
    .returning({ ...affected, verified: runs.verified });
  if (!row) return fail(404, "No such run.");
  await settle(ok.db, row);
  return json({ id: row.id, verified: row.verified });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const ok = await guard(ctx);
  if (ok instanceof Response) return ok;
  const [row] = await ok.db.delete(runs).where(eq(runs.id, ok.id)).returning(affected);
  if (!row) return fail(404, "No such run.");
  await settle(ok.db, row);
  return json({ deleted: row.id });
}
