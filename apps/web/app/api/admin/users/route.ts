import { z } from "zod";
import { getDb } from "@/db/client";
import { currentAdmin } from "@/lib/server/admin";
import { fail, json, readBody } from "@/lib/server/http";
import { idsSchema, setRanked } from "@/lib/server/moderation";

/** Bulk moderation: takes every user in `ids` off the leaderboards, or puts them back. */
export async function PATCH(request: Request) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db) return fail(404, "Not found.");
  const body = await readBody(request, z.object({ ids: idsSchema, ranked: z.boolean() }), 20_000);
  if (body instanceof Response) return body;
  const rows = await setRanked(db, body.ids, body.ranked);
  return json({ updated: rows.length });
}
