import { z } from "zod";
import { getDb } from "@/db/client";
import { fail, json, NO_DATABASE, readBody } from "@/lib/server/http";
import { displayNameSchema, ensurePlayer } from "@/lib/server/player";
import { rateLimited } from "@/lib/server/rate-limit";
import { createRoom } from "@/lib/server/rooms";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NO_DATABASE();
  const limited = await rateLimited(request, "rooms:create", 6);
  if (limited) return limited;
  const body = await readBody(request, z.object({ name: z.string() }));
  if (body instanceof Response) return body;
  const name = displayNameSchema.safeParse(body.name);
  if (!name.success) return fail(400, "Pick a display name of 1 to 24 letters or numbers.");

  const host = await ensurePlayer(name.data);
  return json({ code: await createRoom(db, host) }, 201);
}
