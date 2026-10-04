import "server-only";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db/client";
import { guests, roomPlayers, rooms, runs, users } from "@/db/schema";
import type { AdminRoomFilter, AdminRunFilter, AdminStore, AdminUserFilter } from "@/lib/cloud-contract";

/** A case-insensitive "contains" test. The term is escaped, so `%` and `_` match themselves. */
function contains(term: string | undefined, ...columns: Parameters<typeof ilike>[0][]): SQL | undefined {
  const text = term?.trim();
  if (!text) return undefined;
  const pattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  return or(...columns.map((column) => ilike(column, pattern)));
}

// One definition of "matches" per table, shared by the page query and its count.
const runsWhere = ({ flaggedOnly, search, result, verified }: { flaggedOnly: boolean } & AdminRunFilter) =>
  and(
    flaggedOnly ? sql`jsonb_array_length(${runs.flags}) > 0` : undefined,
    contains(search, runs.defuserName, runs.missionId),
    result ? eq(runs.result, result) : undefined,
    verified === undefined ? undefined : eq(runs.verified, verified),
  );
const roomsWhere = (filter: AdminRoomFilter) =>
  and(contains(filter.search, rooms.code), filter.status ? eq(rooms.status, filter.status) : undefined);
const usersWhere = (filter: AdminUserFilter) =>
  and(
    contains(filter.search, users.name, users.login, users.email),
    filter.role ? eq(users.role, filter.role) : undefined,
  );

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

    async runs({ limit, offset = 0, ...filter }) {
      const rows = await db
        .select({
          r: {
            id: runs.id,
            createdAt: runs.createdAt,
            missionId: runs.missionId,
            defuserName: runs.defuserName,
            result: runs.result,
            reason: runs.reason,
            timeRemainingMs: runs.timeRemainingMs,
            strikes: runs.strikes,
            verified: runs.verified,
            flags: runs.flags,
            engineVersion: runs.engineVersion,
            bombSeed: runs.bombSeed,
            ruleSeed: runs.ruleSeed,
          },
          // Counted in SQL so a page of runs does not pull every action log across the wire.
          actionCount: sql<number>`jsonb_array_length(${runs.actionLog} -> 'actions')`.mapWith(Number),
          expertCount: sql<number>`cardinality(${runs.expertIds})`.mapWith(Number),
          roomCode: rooms.code,
        })
        .from(runs)
        .leftJoin(rooms, eq(rooms.id, runs.roomId))
        .where(runsWhere(filter))
        // The id breaks ties, so a row cannot appear on two pages.
        .orderBy(desc(runs.createdAt), runs.id)
        .limit(limit)
        .offset(offset);
      return rows.map(({ r, ...counts }) => ({ ...r, ...counts, createdAt: r.createdAt.toISOString() }));
    },

    async rooms(limit, filter = {}) {
      const rows = await db
        .select({
          code: rooms.code,
          status: rooms.status,
          createdAt: rooms.createdAt,
          expiresAt: rooms.expiresAt,
          players: count(roomPlayers.playerId),
          missionId: rooms.missionId,
          startedAt: rooms.startedAt,
          roster: sql<{ name: string; role: string }[]>`coalesce(
            json_agg(json_build_object('name', ${roomPlayers.displayName}, 'role', ${roomPlayers.role})
              order by ${roomPlayers.joinedAt}) filter (where ${roomPlayers.playerId} is not null),
            '[]'::json)`,
        })
        .from(rooms)
        .leftJoin(roomPlayers, eq(roomPlayers.roomId, rooms.id))
        .where(roomsWhere(filter))
        .groupBy(rooms.id)
        .orderBy(desc(rooms.createdAt), rooms.id)
        .limit(limit)
        .offset(filter.offset ?? 0);
      return rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
        startedAt: r.startedAt?.toISOString() ?? null,
      }));
    },

    async users(limit, filter = {}) {
      const rows = await db
        .select({ user: users, runs: count(runs.id) })
        .from(users)
        .leftJoin(runs, eq(runs.defuserId, users.id))
        .where(usersWhere(filter))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt), users.id)
        .limit(limit)
        .offset(filter.offset ?? 0);
      return rows.map(({ user: u, runs: saved }) => ({
        id: u.id,
        githubId: u.githubId,
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

    async countRuns(filter) {
      return (await db.select({ n: count() }).from(runs).where(runsWhere(filter)))[0]?.n ?? 0;
    },
    async countRooms(filter = {}) {
      return (await db.select({ n: count() }).from(rooms).where(roomsWhere(filter)))[0]?.n ?? 0;
    },
    async countUsers(filter = {}) {
      return (await db.select({ n: count() }).from(users).where(usersWhere(filter)))[0]?.n ?? 0;
    },
  };
}
