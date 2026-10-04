import "server-only";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db/client";
import { guests, roomPlayers, rooms, runs, users } from "@/db/schema";
import type { AdminStore } from "@/lib/cloud-contract";

/** A case-insensitive "contains" test. The term is escaped, so `%` and `_` match themselves. */
function contains(term: string | undefined, ...columns: Parameters<typeof ilike>[0][]): SQL | undefined {
  const text = term?.trim();
  if (!text) return undefined;
  const pattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  return or(...columns.map((column) => ilike(column, pattern)));
}

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

    async runs({ flaggedOnly, limit, search, result, verified }) {
      const rows = await db
        .select()
        .from(runs)
        .where(
          and(
            flaggedOnly ? sql`jsonb_array_length(${runs.flags}) > 0` : undefined,
            contains(search, runs.defuserName, runs.missionId),
            result ? eq(runs.result, result) : undefined,
            verified === undefined ? undefined : eq(runs.verified, verified),
          ),
        )
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

    async rooms(limit, filter = {}) {
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
        .where(
          and(
            contains(filter.search, rooms.code),
            filter.status ? eq(rooms.status, filter.status) : undefined,
          ),
        )
        .groupBy(rooms.id)
        .orderBy(desc(rooms.createdAt))
        .limit(limit);
      return rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
      }));
    },

    async users(limit, filter = {}) {
      const rows = await db
        .select({ user: users, runs: count(runs.id) })
        .from(users)
        .leftJoin(runs, eq(runs.defuserId, users.id))
        .where(
          and(
            contains(filter.search, users.name, users.login, users.email),
            filter.role ? eq(users.role, filter.role) : undefined,
          ),
        )
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
