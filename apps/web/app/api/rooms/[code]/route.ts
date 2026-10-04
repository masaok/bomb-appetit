import { getDb } from "@/db/client";
import { roomCodeSchema, roomOpSchema } from "@/lib/rooms";
import { fail, json, NO_DATABASE, readBody } from "@/lib/server/http";
import { currentPlayer, displayNameSchema, ensurePlayer } from "@/lib/server/player";
import { rateLimited } from "@/lib/server/rate-limit";
import { applyRoomOp, loadRoom, viewRoom } from "@/lib/server/rooms";

const NOT_FOUND = () => fail(404, "No room with that code. It may have expired.");

export async function GET(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const db = getDb();
  if (!db) return NO_DATABASE();
  const code = roomCodeSchema.safeParse((await ctx.params).code.toUpperCase());
  const found = code.success ? await loadRoom(db, code.data) : null;
  if (!found) return NOT_FOUND();
  return json(await viewRoom(db, found.room, found.players, await currentPlayer()));
}

export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  const db = getDb();
  if (!db) return NO_DATABASE();
  // The Defuser reports status about once a second, so the budget is per room member, not tight.
  const limited = await rateLimited(request, "rooms:op", 240);
  if (limited) return limited;
  const code = roomCodeSchema.safeParse((await ctx.params).code.toUpperCase());
  const op = await readBody(request, roomOpSchema, 20_000);
  if (op instanceof Response) return op;
  const found = code.success ? await loadRoom(db, code.data) : null;
  if (!found) return NOT_FOUND();

  let player = await currentPlayer();
  if (op.op === "join") {
    const name = displayNameSchema.safeParse(op.name);
    if (!name.success) return fail(400, "Pick a display name of 1 to 24 letters or numbers.");
    player = await ensurePlayer(name.data);
  }
  if (!player) return fail(401, "Join the room first.");

  const result = await applyRoomOp(db, found.room, found.players, player, op);
  if (!result.ok) return fail(result.status, result.error);

  // Status pings are frequent and their sender already knows the room; skip the re-read.
  if (op.op === "status") return json({ ok: true });
  const fresh = await loadRoom(db, found.room.code);
  return fresh ? json(await viewRoom(db, fresh.room, fresh.players, player)) : NOT_FOUND();
}
