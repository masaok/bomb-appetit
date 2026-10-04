import { z } from "zod";
import { getDb } from "@/db/client";
import { currentAdmin } from "@/lib/server/admin";
import { fail, json, readBody } from "@/lib/server/http";
import { deleteRuns, idsSchema, patchRuns, runBulkPatchSchema } from "@/lib/server/moderation";

async function guard() {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  return admin && db ? db : fail(404, "Not found.");
}

/** Bulk moderation: the single-run PATCH, applied to every run in `ids`. */
export async function PATCH(request: Request) {
  const db = await guard();
  if (db instanceof Response) return db;
  const body = await readBody(request, runBulkPatchSchema, 20_000);
  if (body instanceof Response) return body;
  const { ids, ...change } = body;
  const rows = await patchRuns(db, ids, change);
  return json({ updated: rows.length });
}

/** Bulk moderation: deletes every run in `ids`. */
export async function DELETE(request: Request) {
  const db = await guard();
  if (db instanceof Response) return db;
  const body = await readBody(request, z.object({ ids: idsSchema }), 20_000);
  if (body instanceof Response) return body;
  const deleted = await deleteRuns(db, body.ids);
  return json({ deleted: deleted.length });
}
