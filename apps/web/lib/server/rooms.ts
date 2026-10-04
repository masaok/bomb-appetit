import "server-only";
import { randomInt } from "node:crypto";
import type { BombSpec } from "@bombappetit/engine";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { roomPlayers, rooms, runs } from "@/db/schema";
import { DEFAULT_FREEPLAY, freeplaySpec } from "@/lib/freeplay";
import { missionById, missionSpec } from "@/lib/missions";
import { roomChannel } from "@/lib/realtime/adapter";
import { realtime } from "@/lib/realtime/server";
import {
  MAX_EXPERTS,
  ROOM_CODE_ALPHABET,
  ROOM_LIFETIME_MS,
  type RoomOp,
  type RoomSetup,
  type RoomView,
} from "@/lib/rooms";
import type { Player } from "./player";
import { issueTicket, randomBombSeed } from "./tickets";

type Room = typeof rooms.$inferSelect;
type RoomPlayerRow = typeof roomPlayers.$inferSelect;

export type OpResult = { ok: true } | { ok: false; status: number; error: string };
const no = (status: number, error: string): OpResult => ({ ok: false, status, error });

function newCode(): string {
  return Array.from({ length: 5 }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join("");
}

export async function createRoom(db: Db, host: Player): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const [room] = await db
      .insert(rooms)
      .values({
        code: newCode(),
        hostId: host.id,
        freeplayConfig: DEFAULT_FREEPLAY,
        bombSeed: randomBombSeed(),
        ruleSeed: DEFAULT_FREEPLAY.ruleSeed,
        expiresAt: new Date(Date.now() + ROOM_LIFETIME_MS),
      })
      .onConflictDoNothing({ target: rooms.code })
      .returning();
    if (room) {
      await db
        .insert(roomPlayers)
        .values({ roomId: room.id, playerId: host.id, role: "defuser", displayName: host.name });
      return room.code;
    }
  }
  throw new Error("Could not allocate a room code");
}

export async function loadRoom(
  db: Db,
  code: string,
): Promise<{ room: Room; players: RoomPlayerRow[] } | null> {
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.code, code), gt(rooms.expiresAt, new Date())));
  if (!room) return null;
  const players = await db
    .select()
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, room.id))
    .orderBy(roomPlayers.joinedAt);
  return { room, players };
}

function setupOf(room: Room): RoomSetup {
  if (room.missionId) return { kind: "mission", missionId: room.missionId };
  return { kind: "freeplay", config: room.freeplayConfig ?? DEFAULT_FREEPLAY };
}

function specOf(room: Room): BombSpec | null {
  const setup = setupOf(room);
  if (setup.kind === "freeplay") return freeplaySpec(setup.config, room.bombSeed);
  const mission = missionById(setup.missionId);
  return mission ? missionSpec(mission, room.bombSeed) : null;
}

/** Builds the view for one viewer. Only the Defuser's view carries the bomb. */
export async function viewRoom(
  db: Db,
  room: Room,
  players: RoomPlayerRow[],
  viewer: Player | null,
): Promise<RoomView> {
  const me = viewer ? players.find((p) => p.playerId === viewer.id) : undefined;
  const spec = room.status === "armed" && me?.role === "defuser" ? specOf(room) : null;

  const [last] =
    room.status === "ended"
      ? await db
          .select()
          .from(runs)
          .where(eq(runs.ticketId, room.roundId))
          .orderBy(desc(runs.createdAt))
          .limit(1)
      : [];

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    players: players.map((p) => ({ id: p.playerId, name: p.displayName, role: p.role })),
    setup: setupOf(room),
    ruleSeed: room.ruleSeed,
    startedAt: room.startedAt?.toISOString() ?? null,
    lastStatus: room.status === "lobby" ? null : room.lastStatus,
    lastResult: last
      ? {
          runId: last.id,
          result: last.result,
          reason: last.reason,
          timeRemainingMs: last.timeRemainingMs,
          strikes: last.strikes,
          verified: last.verified,
        }
      : null,
    you: me && viewer ? { id: viewer.id, role: me.role, isHost: room.hostId === viewer.id } : null,
    defuser:
      spec && room.startedAt
        ? {
            spec,
            ticket: issueTicket({
              id: room.roundId,
              spec,
              missionId: room.missionId,
              roomCode: room.code,
              serverSeed: true,
              issuedAt: room.startedAt.getTime(),
            }),
          }
        : null,
  };
}

/** Postgres reports a broken unique index as SQLSTATE 23505, possibly wrapped by the driver. */
function isUniqueViolation(error: unknown): boolean {
  for (let e = error, depth = 0; e instanceof Error && depth < 5; e = e.cause, depth++) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}

export async function applyRoomOp(
  db: Db,
  room: Room,
  players: RoomPlayerRow[],
  player: Player,
  op: RoomOp,
): Promise<OpResult> {
  const me = players.find((p) => p.playerId === player.id);
  const channel = roomChannel(room.code);
  const isHost = room.hostId === player.id;
  const changed = () => realtime.publish(channel, "room:update", {});

  switch (op.op) {
    case "join": {
      if (me) return { ok: true };
      if (players.filter((p) => p.role === "expert").length >= MAX_EXPERTS)
        return no(409, "This room is full.");
      await db
        .insert(roomPlayers)
        .values({ roomId: room.id, playerId: player.id, role: "expert", displayName: player.name })
        .onConflictDoNothing();
      await changed();
      return { ok: true };
    }

    case "role": {
      if (!me) return no(403, "Join the room first.");
      if (room.status === "armed") return no(409, "Roles are locked while the bomb is armed.");
      if (op.role === "expert" && players.filter((p) => p.role === "expert").length >= MAX_EXPERTS) {
        return no(409, "There are already four Experts.");
      }
      try {
        await db
          .update(roomPlayers)
          .set({ role: op.role })
          .where(and(eq(roomPlayers.roomId, room.id), eq(roomPlayers.playerId, player.id)));
      } catch (error) {
        if (isUniqueViolation(error)) return no(409, "Someone else is already the Defuser.");
        throw error;
      }
      await changed();
      return { ok: true };
    }

    case "setup": {
      if (!isHost) return no(403, "Only the host can change the setup.");
      if (room.status === "armed") return no(409, "The bomb is already armed.");
      if (op.setup.kind === "mission") {
        const mission = missionById(op.setup.missionId);
        if (!mission) return no(400, "Unknown mission.");
        await db
          .update(rooms)
          .set({ missionId: mission.id, freeplayConfig: null, ruleSeed: mission.ruleSeed })
          .where(eq(rooms.id, room.id));
      } else {
        await db
          .update(rooms)
          .set({ missionId: null, freeplayConfig: op.setup.config, ruleSeed: op.setup.config.ruleSeed })
          .where(eq(rooms.id, room.id));
      }
      await changed();
      return { ok: true };
    }

    case "start": {
      if (!isHost) return no(403, "Only the host can start the game.");
      if (!players.some((p) => p.role === "defuser")) return no(409, "Someone has to be the Defuser.");
      const [started] = await db
        .update(rooms)
        .set({
          status: "armed",
          bombSeed: randomBombSeed(),
          roundId: sql`gen_random_uuid()`,
          startedAt: new Date(),
          lastStatus: null,
        })
        // The status guard makes a double-click or two racing hosts start exactly one game.
        .where(and(eq(rooms.id, room.id), sql`${rooms.status} <> 'armed'`))
        .returning();
      if (!started?.startedAt) return no(409, "The game has already started.");
      await realtime.publish(channel, "game:start", {
        ruleSeed: started.ruleSeed,
        startedAt: started.startedAt.toISOString(),
      });
      return { ok: true };
    }

    case "status": {
      if (me?.role !== "defuser" || room.status !== "armed")
        return no(403, "Only the Defuser of an armed bomb reports status.");
      await db
        .update(rooms)
        .set({ lastStatus: op.status })
        .where(and(eq(rooms.id, room.id), eq(rooms.status, "armed")));
      await realtime.publish(channel, "game:status", op.status);
      return { ok: true };
    }

    case "reset": {
      if (!isHost) return no(403, "Only the host can reset the room.");
      await db
        .update(rooms)
        .set({ status: "lobby", startedAt: null, lastStatus: null })
        .where(eq(rooms.id, room.id));
      await realtime.publish(channel, "room:reset", {});
      return { ok: true };
    }

    case "leave": {
      if (!me) return { ok: true };
      if (room.status === "armed" && me.role === "defuser")
        return no(409, "The Defuser cannot leave an armed bomb.");
      await db
        .delete(roomPlayers)
        .where(and(eq(roomPlayers.roomId, room.id), eq(roomPlayers.playerId, player.id)));
      await changed();
      return { ok: true };
    }
  }
}
