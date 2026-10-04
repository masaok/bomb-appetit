import { z } from "zod";
import { getDb } from "@/db/client";
import { currentAdmin } from "@/lib/server/admin";
import { fail, json, readBody } from "@/lib/server/http";
import { deleteRooms, roomCodesSchema } from "@/lib/server/moderation";

/** Bulk moderation: deletes every room whose code is in `ids`. */
export async function DELETE(request: Request) {
  const admin = await currentAdmin();
  const db = getDb();
  // Same answer for "not an admin" and "no such route", so the endpoint cannot be probed.
  if (!admin || !db) return fail(404, "Not found.");
  const body = await readBody(request, z.object({ ids: roomCodesSchema }), 20_000);
  if (body instanceof Response) return body;
  const deleted = await deleteRooms(db, body.ids);
  return json({ deleted: deleted.length });
}
