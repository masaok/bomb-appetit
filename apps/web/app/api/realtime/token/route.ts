import { getDb } from "@/db/client";
import { roomChannel } from "@/lib/realtime/adapter";
import { authorizeChannel } from "@/lib/realtime/server";
import { roomCodeSchema } from "@/lib/rooms";
import { fail, json, NO_DATABASE } from "@/lib/server/http";
import { currentPlayer } from "@/lib/server/player";
import { rateLimited } from "@/lib/server/rate-limit";
import { loadRoom } from "@/lib/server/rooms";

/**
 * Pusher's channel-authorization endpoint. A browser may subscribe to a room's
 * presence channel only if the server confirms it is a member of that room.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NO_DATABASE();
  const limited = await rateLimited(request, "realtime:token", 60);
  if (limited) return limited;

  const form = await request.formData();
  const socketId = form.get("socket_id");
  const channel = form.get("channel_name");
  if (typeof socketId !== "string" || typeof channel !== "string" || !/^\d+\.\d+$/.test(socketId)) {
    return fail(400, "Bad authorization request.");
  }
  const code = roomCodeSchema.safeParse(channel.replace(/^presence-room-/, ""));
  if (!code.success || channel !== roomChannel(code.data)) return fail(403, "Unknown channel.");

  const player = await currentPlayer();
  const found = await loadRoom(db, code.data);
  const member = player && found?.players.find((p) => p.playerId === player.id);
  if (!player || !member) return fail(403, "You are not in this room.");

  const signed = authorizeChannel(socketId, channel, {
    id: player.id,
    name: member.displayName,
    role: member.role,
  });
  return signed ? json(signed) : fail(503, "Realtime is not configured.");
}
