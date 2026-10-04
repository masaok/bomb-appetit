import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { runs } from "@/db/schema";
import { formatDuration } from "@/components/hud/format";
import { PageIntro } from "@/components/marketing/page-intro";
import { missionById, MISSIONS } from "@/lib/missions";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The fastest verified defusals for every mission.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const query = await searchParams;
  const mission = (typeof query.mission === "string" && missionById(query.mission)) || MISSIONS[0];
  const db = getDb();

  // Only runs the server replayed and the plausibility checks accepted are ranked.
  const rows =
    db && mission
      ? await db
          .select({
            id: runs.id,
            name: runs.defuserName,
            timeRemainingMs: runs.timeRemainingMs,
            strikes: runs.strikes,
            createdAt: runs.createdAt,
          })
          .from(runs)
          .where(and(eq(runs.missionId, mission.id), eq(runs.verified, true), eq(runs.result, "defused")))
          .orderBy(desc(runs.timeRemainingMs), runs.strikes, runs.createdAt)
          .limit(50)
      : [];

  return (
    <>
      <PageIntro kicker="Leaderboard" title="Most time left on the clock">
        Every run here was replayed by the server from its action log. Only verified defusals count.
      </PageIntro>
      <div className="mx-auto max-w-4xl px-6 pb-20">
        <form className="flex flex-wrap items-end gap-3" action="/leaderboard">
          <label className="grid gap-1">
            <span className="text-sm font-bold">Mission</span>
            <select
              name="mission"
              defaultValue={mission?.id}
              className="sticker rounded-xl bg-card px-3 py-2 font-bold"
            >
              {MISSIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.section}.{m.order} {m.title}
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

        {!db ? (
          <p className="mt-8 font-bold">This server has no database, so there are no leaderboards here.</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-lg">
            Nobody has defused {mission?.title} yet.{" "}
            <Link href={`/bomb?mission=${mission?.id}`} className="font-bold underline">
              Be the first.
            </Link>
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="manual-table w-full">
              <caption className="sr-only">Fastest verified defusals of {mission?.title}</caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Defuser</th>
                  <th scope="col">Time left</th>
                  <th scope="col">Strikes</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="font-bold tabular-nums">{i + 1}</td>
                    <td>
                      <Link href={`/results/${row.id}`} className="font-bold underline">
                        {row.name}
                      </Link>
                    </td>
                    <td className="font-mono tabular-nums">{formatDuration(row.timeRemainingMs)}</td>
                    <td className="tabular-nums">{row.strikes}</td>
                    <td>{row.createdAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
