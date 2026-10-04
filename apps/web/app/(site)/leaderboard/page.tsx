import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { formatDuration } from "@/components/hud/format";
import { PageIntro } from "@/components/marketing/page-intro";
import { missionById, MISSIONS } from "@/lib/missions";
import { cachedBoardPage } from "@/lib/server/board-cache";
import { PAGE_SIZE, standing, TEAM_FILTERS, type BoardRow, type TeamFilter } from "@/lib/server/leaderboard";
import { currentPlayer } from "@/lib/server/player";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The fastest verified defusals for every mission.",
};

const TEAM_LABELS: Record<TeamFilter, string> = {
  all: "Everyone",
  solo: "Solo",
  team: "With Experts",
};

/** A whole number from the query string, or the fallback when it is missing or out of range. */
function whole(value: string | string[] | undefined, fallback: number, max: number): number {
  const n = typeof value === "string" && /^\d{1,6}$/.test(value) ? Number(value) : fallback;
  return n >= 1 && n <= max ? n : fallback;
}

function Row({ row, mine }: { row: BoardRow; mine: boolean }) {
  return (
    <tr className={mine ? "bg-sun/30" : undefined}>
      <td className="font-bold tabular-nums">{row.rank}</td>
      <td>
        <Link href={`/results/${row.runId}`} className="font-bold underline">
          {row.name}
        </Link>
        {mine && <span className="ml-2 text-sm font-bold">You</span>}
      </td>
      <td>
        {row.expertNames.length > 0 ? row.expertNames.join(", ") : <span className="text-muted">Solo</span>}
      </td>
      <td className="font-mono tabular-nums">{formatDuration(row.timeRemainingMs)}</td>
      <td className="tabular-nums">{row.strikes}</td>
      <td>{row.createdAt.slice(0, 10)}</td>
    </tr>
  );
}

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const query = await searchParams;
  const mission = (typeof query.mission === "string" && missionById(query.mission)) || MISSIONS[0]!;
  const team = TEAM_FILTERS.find((t) => t === query.team) ?? "all";
  const epoch = whole(query.epoch, mission.boardEpoch, mission.boardEpoch);
  const archived = epoch !== mission.boardEpoch;
  const page = whole(query.page, 1, 100_000);
  const board = { missionId: mission.id, epoch };

  const db = getDb();
  const player = db ? await currentPlayer() : null;
  const [{ rows, total }, mine] = await Promise.all([
    cachedBoardPage(board, team, page),
    db && player?.kind === "user" ? standing(db, board, player.id, team) : null,
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const mineIsBelow = mine && !rows.some((row) => row.playerId === mine.row.playerId);

  /** This board's address with some of its settings changed. Defaults are left out of the URL. */
  const href = (change: { team?: TeamFilter; page?: number; epoch?: number }) => {
    const next = { team, page: 1, epoch, ...change };
    const params = new URLSearchParams({ mission: mission.id });
    if (next.team !== "all") params.set("team", next.team);
    if (next.epoch !== mission.boardEpoch) params.set("epoch", String(next.epoch));
    if (next.page > 1) params.set("page", String(next.page));
    return `/leaderboard?${params}`;
  };

  return (
    <>
      <PageIntro kicker="Leaderboard" title="Most time left on the clock">
        Every run here was replayed by the server from its action log. Each player is listed once, by their
        best verified defusal. Sign in to be ranked.
      </PageIntro>
      <div className="mx-auto max-w-4xl px-6 pb-20">
        <form className="flex flex-wrap items-end gap-3" action="/leaderboard">
          <label className="grid gap-1">
            <span className="text-sm font-bold">Mission</span>
            <select
              name="mission"
              defaultValue={mission.id}
              className="sticker rounded-xl bg-card px-3 py-2 font-bold"
            >
              {MISSIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.section}.{m.order} {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">Team</span>
            <select
              name="team"
              defaultValue={team}
              className="sticker rounded-xl bg-card px-3 py-2 font-bold"
            >
              {TEAM_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {TEAM_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="sticker sticker-press rounded-full bg-sun px-5 py-2 font-bold text-night"
          >
            Show
          </button>
        </form>

        <p className="mt-4 text-sm text-muted">
          {mission.fixedBombSeed !== null && "Same bomb for everyone on this mission. "}
          {archived ? (
            <>
              Archived board {epoch} of {mission.boardEpoch}. The mission has changed since, so these times
              are kept apart.{" "}
              <Link href={href({ epoch: mission.boardEpoch })} className="font-bold underline">
                Current board
              </Link>
            </>
          ) : (
            mission.boardEpoch > 1 && (
              <>
                This mission has changed.{" "}
                <Link href={href({ epoch: mission.boardEpoch - 1 })} className="font-bold underline">
                  See the board before the change
                </Link>
              </>
            )
          )}
        </p>

        {mine && (
          <p className="sticker mt-4 rounded-2xl bg-mint px-4 py-3 font-bold text-night">
            You are #{mine.rank} of {mine.total}, in the top {mine.topPercent}%.
          </p>
        )}

        {!db ? (
          <p className="mt-8 font-bold">This server has no database, so there are no leaderboards here.</p>
        ) : total === 0 ? (
          <p className="mt-8 text-lg">
            {team === "all" ? `Nobody is ranked on ${mission.title} yet.` : "No runs match this filter yet."}{" "}
            {!archived && (
              <Link href={`/bomb?mission=${mission.id}`} className="font-bold underline">
                Be the first.
              </Link>
            )}
          </p>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="manual-table w-full">
                <caption className="sr-only">
                  Best verified defusals of {mission.title}, {TEAM_LABELS[team]}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Defuser</th>
                    <th scope="col">Experts</th>
                    <th scope="col">Time left</th>
                    <th scope="col">Strikes</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <Row key={row.runId} row={row} mine={row.playerId === mine?.row.playerId} />
                  ))}
                </tbody>
                {mineIsBelow && (
                  // The signed-in player's own row, when it is not on the page being shown.
                  <tfoot>
                    <Row row={mine.row} mine />
                  </tfoot>
                )}
              </table>
            </div>
            {pages > 1 && (
              <nav aria-label="Leaderboard pages" className="mt-4 flex items-center gap-4 font-bold">
                {page > 1 && (
                  <Link href={href({ page: Math.min(page, pages + 1) - 1 })} className="underline">
                    Previous
                  </Link>
                )}
                <span className="text-muted">
                  Page {page} of {pages}
                </span>
                {page < pages && (
                  <Link href={href({ page: page + 1 })} className="underline">
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
