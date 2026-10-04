import "server-only";
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db/client";
import { MISSIONS } from "@/lib/missions";

/**
 * The leaderboards. A board is one mission at one board epoch. It lists each ranked
 * player once, by their best verified defusal. Every page that shows a rank reads it
 * from here, so "rank" has one definition.
 */

export const TEAM_FILTERS = ["all", "solo", "team"] as const;
export type TeamFilter = (typeof TEAM_FILTERS)[number];

export const PAGE_SIZE = 50;

export interface BoardRef {
  missionId: string;
  epoch: number;
}

export interface BoardRow {
  rank: number;
  runId: string;
  playerId: string;
  name: string;
  timeRemainingMs: number;
  strikes: number;
  /** ISO 8601, so a row survives the data cache unchanged. */
  createdAt: string;
  /** Empty for a solo run. */
  expertNames: string[];
}

export interface Standing {
  rank: number;
  /** Players on the board. */
  total: number;
  /** "Top N%": the share of the board that is at or above this rank, rounded up. */
  topPercent: number;
  timeRemainingMs: number;
  runId: string;
}

/**
 * The ordering, written once: most time left, then fewest strikes, then the earlier run.
 * The id only makes the order total, so two pages never share a row.
 */
const bestFirst = (t: "r" | "best") =>
  sql.raw(`${t}.time_remaining_ms desc, ${t}.strikes asc, ${t}.created_at asc, ${t}.id asc`);

const teamClause = (team: TeamFilter): SQL =>
  team === "solo" ? sql`and r.team_size = 1` : team === "team" ? sql`and r.team_size > 1` : sql``;

/**
 * `ranked`: one row per player per board, with their rank and the board's size.
 * Only signed-in users who have not been taken off the boards are ranked, and only
 * runs the server replayed and the plausibility checks accepted.
 */
function rankedCte(boards: BoardRef[], team: TeamFilter): SQL {
  const boardList = sql.join(
    boards.map((b) => sql`(${b.missionId}::text, ${b.epoch}::int)`),
    sql`, `,
  );
  return sql`
    with best as (
      select distinct on (r.mission_id, r.defuser_id)
        r.id, r.mission_id, r.defuser_id, u.name, r.time_remaining_ms, r.strikes, r.created_at, r.expert_names
      from runs r
      join users u on u.id = r.defuser_id and u.ranked
      join (values ${boardList}) as board (mission_id, epoch)
        on board.mission_id = r.mission_id and board.epoch = r.board_epoch
      where r.verified and r.result = 'defused' ${teamClause(team)}
      order by r.mission_id, r.defuser_id, ${bestFirst("r")}
    ),
    ranked as (
      select best.*,
        (row_number() over (partition by best.mission_id order by ${bestFirst("best")}))::int as rank,
        (count(*) over (partition by best.mission_id))::int as total
      from best
    )`;
}

type Row = Record<string, unknown>;

async function rows(db: Db, query: SQL): Promise<Row[]> {
  return (await db.execute(query)).rows as Row[];
}

export function topPercent(rank: number, total: number): number {
  return Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)));
}

function toBoardRow(r: Row): BoardRow {
  return {
    rank: Number(r.rank),
    runId: String(r.id),
    playerId: String(r.defuser_id),
    name: String(r.name),
    timeRemainingMs: Number(r.time_remaining_ms),
    strikes: Number(r.strikes),
    createdAt: new Date(r.created_at as string).toISOString(),
    expertNames: (r.expert_names as string[] | null) ?? [],
  };
}

function toStanding(r: Row): Standing {
  const rank = Number(r.rank);
  const total = Number(r.total);
  return {
    rank,
    total,
    topPercent: topPercent(rank, total),
    timeRemainingMs: Number(r.time_remaining_ms),
    runId: String(r.id),
  };
}

/** The board each mission's new runs go on. */
export function currentBoards(): BoardRef[] {
  return MISSIONS.map((m) => ({ missionId: m.id, epoch: m.boardEpoch }));
}

/** One page of a board, best first, and how many players the whole board has. */
export async function boardPage(
  db: Db,
  board: BoardRef,
  options: { team?: TeamFilter; page?: number; pageSize?: number } = {},
): Promise<{ rows: BoardRow[]; total: number }> {
  const { team = "all", page = 1, pageSize = PAGE_SIZE } = options;
  const first = (page - 1) * pageSize;
  const found = await rows(
    db,
    sql`${rankedCte([board], team)}
      select * from ranked where rank > ${first} and rank <= ${first + pageSize} order by rank`,
  );
  if (found.length > 0) return { rows: found.map(toBoardRow), total: Number(found[0]!.total) };
  if (page === 1) return { rows: [], total: 0 };
  // Past the last page. The board may still have players, so count them.
  const [count] = await rows(db, sql`${rankedCte([board], team)} select count(*)::int as total from ranked`);
  return { rows: [], total: Number(count?.total ?? 0) };
}

/** Where one player stands on one board, or null when they are not on it. */
export async function standing(
  db: Db,
  board: BoardRef,
  playerId: string,
  team: TeamFilter = "all",
): Promise<(Standing & { row: BoardRow }) | null> {
  const [found] = await rows(
    db,
    sql`${rankedCte([board], team)} select * from ranked where defuser_id = ${playerId}::uuid`,
  );
  return found ? { ...toStanding(found), row: toBoardRow(found) } : null;
}

/** Where one player stands on every current board they are on, keyed by mission id. */
export async function standings(db: Db, playerId: string): Promise<Map<string, Standing>> {
  const found = await rows(
    db,
    sql`${rankedCte(currentBoards(), "all")} select * from ranked where defuser_id = ${playerId}::uuid`,
  );
  return new Map(found.map((r) => [String(r.mission_id), toStanding(r)]));
}

/** How many players each current board has, keyed by mission id. Empty boards are absent. */
export async function boardSizes(db: Db): Promise<Map<string, number>> {
  const found = await rows(
    db,
    sql`${rankedCte(currentBoards(), "all")}
      select mission_id, count(*)::int as total from ranked group by mission_id`,
  );
  return new Map(found.map((r) => [String(r.mission_id), Number(r.total)]));
}

export interface Candidate {
  /** The rank this run would take on its board if it were listed now. */
  boardRank: number;
  /** Players on the board, counting this one. */
  boardSize: number;
  /** The player's best time left on this board before this run. Null if they had none. */
  priorBestMs: number | null;
  /** Runs the player had already saved on this mission, with any result. */
  priorAttempts: number;
}

/**
 * Where a defusal that has not been saved yet would land, for the plausibility checks.
 * It loses every tie, because an equal run that is already saved is the earlier one.
 */
export async function candidate(
  db: Db,
  board: BoardRef,
  playerId: string,
  run: { timeRemainingMs: number; strikes: number },
): Promise<Candidate> {
  const [found] = await rows(
    db,
    sql`${rankedCte([board], "all")}
      select
        (select count(*)::int from ranked
          where defuser_id <> ${playerId}::uuid
            and (time_remaining_ms > ${run.timeRemainingMs}
              or (time_remaining_ms = ${run.timeRemainingMs} and strikes <= ${run.strikes}))) as ahead,
        (select count(*)::int from ranked where defuser_id <> ${playerId}::uuid) as others,
        (select time_remaining_ms from ranked where defuser_id = ${playerId}::uuid) as prior_best,
        (select count(*)::int from runs
          where defuser_id = ${playerId}::uuid and mission_id = ${board.missionId}) as prior_attempts`,
  );
  return {
    boardRank: Number(found?.ahead ?? 0) + 1,
    boardSize: Number(found?.others ?? 0) + 1,
    priorBestMs: found?.prior_best == null ? null : Number(found.prior_best),
    priorAttempts: Number(found?.prior_attempts ?? 0),
  };
}
