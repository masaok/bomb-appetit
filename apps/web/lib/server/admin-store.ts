import "server-only";
import { count, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { guests, roomPlayers, rooms, runs, users } from "@/db/schema";
import type { AdminStore } from "@/lib/cloud-contract";

/** The read side handed to the private admin pages. Writes go through /api/admin/*. */
export function adminStore(db: Db): AdminStore {
  const total = async (table: typeof users | typeof guests | typeof rooms | typeof runs) =>
    (await db.select({ n: count() }).from(table))[0]?.n ?? 0;

  return {
    async stats() {
      const [verified] = await db.select({ n: count() }).from(runs).where(eq(runs.verified, true));
      const [flagged] = await db
        .select({ n: count() })
        .from(runs)
        .where(sql`jsonb_array_length(${runs.flags}) > 0`);
      return {
        users: await total(users),
        guests: await total(guests),
        rooms: await total(rooms),
        runs: await total(runs),
        verifiedRuns: verified?.n ?? 0,
        flaggedRuns: flagged?.n ?? 0,
      };
    },

    async runs({ flaggedOnly, limit }) {
      const rows = await db
        .select()
        .from(runs)
        .where(flaggedOnly ? sql`jsonb_array_length(${runs.flags}) > 0` : undefined)
        .orderBy(desc(runs.createdAt))
        .limit(limit);
      return rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        missionId: r.missionId,
        defuserName: r.defuserName,
        result: r.result,
        reason: r.reason,
        timeRemainingMs: r.timeRemainingMs,
        strikes: r.strikes,
        verified: r.verified,
        flags: r.flags,
      }));
    },

    async rooms(limit) {
      const rows = await db
        .select({
          code: rooms.code,
          status: rooms.status,
          createdAt: rooms.createdAt,
          expiresAt: rooms.expiresAt,
          players: count(roomPlayers.playerId),
        })
        .from(rooms)
        .leftJoin(roomPlayers, eq(roomPlayers.roomId, rooms.id))
        .groupBy(rooms.id)
        .orderBy(desc(rooms.createdAt))
        .limit(limit);
      return rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
      }));
    },

    async users(limit) {
      const rows = await db
        .select({ user: users, runs: count(runs.id) })
        .from(users)
        .leftJoin(runs, eq(runs.defuserId, users.id))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt))
        .limit(limit);
      return rows.map(({ user: u, runs: saved }) => ({
        id: u.id,
        name: u.name,
        login: u.login,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        runs: saved,
      }));
    },
  };
}
