import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { Db } from "@/db/client";
import { guests, roomPlayers, rooms, runs, users } from "@/db/schema";
import type {
  AdminRoomFilter,
  AdminRoomSortKey,
  AdminRunFilter,
  AdminRunSortKey,
  AdminStore,
  AdminUserFilter,
  AdminUserSortKey,
} from "@/lib/cloud-contract";
import { missionById, MISSIONS } from "@/lib/missions";
import { boardPage, boardSizes } from "./leaderboard";

/** A case-insensitive "contains" test. The term is escaped, so `%` and `_` match themselves. */
function contains(term: string | undefined, ...columns: Parameters<typeof ilike>[0][]): SQL | undefined {
  const text = term?.trim();
  if (!text) return undefined;
  const pattern = `%${text.replace(/[\\%_]/g, "\\$&")}%`;
  return or(...columns.map((column) => ilike(column, pattern)));
}

const waitingForReview = sql`jsonb_array_length(${runs.review}) > 0`;
// One definition of "matches" per table, shared by the page query and its count.
const runsWhere = ({
  flaggedOnly,
  search,
  result,
  verified,
  review,
}: { flaggedOnly: boolean } & AdminRunFilter) =>
  and(
    flaggedOnly ? sql`jsonb_array_length(${runs.flags}) > 0` : undefined,
    contains(search, runs.defuserName, runs.missionId),
    result ? eq(runs.result, result) : undefined,
    verified === undefined ? undefined : eq(runs.verified, verified),
    review ? waitingForReview : undefined,
  );
const roomsWhere = (filter: AdminRoomFilter) =>
  and(contains(filter.search, rooms.code), filter.status ? eq(rooms.status, filter.status) : undefined);
const usersWhere = (filter: AdminUserFilter) =>
  and(
    contains(filter.search, users.name, users.login, users.email),
    filter.role ? eq(users.role, filter.role) : undefined,
  );

// The sort keys the admin tables may ask for. A key maps to a column here and nowhere else,
// so nothing from the address bar reaches ORDER BY.
const RUN_ORDER: Record<AdminRunSortKey, PgColumn | SQL> = {
  created: runs.createdAt,
  defuser: sql`lower(${runs.defuserName})`,
  mission: runs.missionId,
  result: runs.result,
  timeLeft: runs.timeRemainingMs,
  strikes: runs.strikes,
};
const ROOM_ORDER: Record<AdminRoomSortKey, PgColumn | SQL> = {
  created: rooms.createdAt,
  code: rooms.code,
  status: rooms.status,
  players: count(roomPlayers.playerId),
  expires: rooms.expiresAt,
};
const USER_ORDER: Record<AdminUserSortKey, PgColumn | SQL> = {
  joined: users.createdAt,
  name: sql`lower(${users.name})`,
  role: users.role,
  runs: count(runs.id),
  lastLogin: users.lastLoginAt,
};

/** ORDER BY for a sort, with nulls at the end either way and the id as the tie-break. */
function order<Key extends string>(
  columns: Record<Key, PgColumn | SQL>,
  sort: { by: Key; dir: "asc" | "desc" } | undefined,
  newest: Key,
  id: PgColumn,
): SQL[] {
  const { by, dir } = sort ?? { by: newest, dir: "desc" as const };
  const column = columns[by] ?? columns[newest];
  // The id breaks ties, so a row cannot appear on two pages.
  return [sql`${dir === "asc" ? asc(column) : desc(column)} nulls last`, asc(id)];
}

/** The read side handed to the private admin pages. Writes go through /api/admin/*. */
export function adminStore(db: Db): AdminStore {
  const total = async (table: typeof users | typeof guests | typeof rooms | typeof runs) =>
    (await db.select({ n: count() }).from(table))[0]?.n ?? 0;

  // The columns of an admin run row. The run list and the leaderboard both select these.
  const runRows = () =>
    db
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
          review: runs.review,
          expertNames: runs.expertNames,
          boardEpoch: runs.boardEpoch,
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
      .$dynamic();
  const toRunRow = ({ r, ...counts }: Awaited<ReturnType<typeof runRows>>[number]) => ({
    ...r,
    ...counts,
    createdAt: r.createdAt.toISOString(),
  });

  return {
    async stats() {
      const [verified] = await db.select({ n: count() }).from(runs).where(eq(runs.verified, true));
      const [flagged] = await db
        .select({ n: count() })
        .from(runs)
        .where(sql`jsonb_array_length(${runs.flags}) > 0`);
      const [review] = await db.select({ n: count() }).from(runs).where(waitingForReview);
      return {
        users: await total(users),
        guests: await total(guests),
        rooms: await total(rooms),
        runs: await total(runs),
        verifiedRuns: verified?.n ?? 0,
        flaggedRuns: flagged?.n ?? 0,
        reviewRuns: review?.n ?? 0,
      };
    },

    async runs({ limit, offset = 0, sort, ...filter }) {
      const rows = await runRows()
        .where(runsWhere(filter))
        .orderBy(...order(RUN_ORDER, sort, "created", runs.id))
        .limit(limit)
        .offset(offset);
      return rows.map(toRunRow);
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
        .orderBy(...order(ROOM_ORDER, filter.sort, "created", rooms.id))
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
        .orderBy(...order(USER_ORDER, filter.sort, "joined", users.id))
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
        ranked: u.ranked,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        runs: saved,
      }));
    },

    async boards() {
      const sizes = await boardSizes(db);
      return MISSIONS.map((m) => ({
        missionId: m.id,
        title: m.title,
        epoch: m.boardEpoch,
        players: sizes.get(m.id) ?? 0,
      }));
    },

    async board(missionId, limit) {
      const mission = missionById(missionId);
      if (!mission) return [];
      // The ranking comes from the same query the public board uses, never from a second one.
      const { rows: ranked } = await boardPage(
        db,
        { missionId, epoch: mission.boardEpoch },
        { pageSize: limit },
      );
      if (ranked.length === 0) return [];
      const found = await runRows().where(
        inArray(
          runs.id,
          ranked.map((r) => r.runId),
        ),
      );
      const byId = new Map(found.map((row) => [row.r.id, toRunRow(row)]));
      return ranked.flatMap((r) => {
        const run = byId.get(r.runId);
        return run ? [{ ...run, rank: r.rank, playerId: r.playerId }] : [];
      });
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
