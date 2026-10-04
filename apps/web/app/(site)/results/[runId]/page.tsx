import { MODULES, replay, type ModuleId } from "@bombappetit/engine";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { runs } from "@/db/schema";
import { formatDuration } from "@/components/hud/format";
import { missionById } from "@/lib/missions";

export const metadata: Metadata = { title: "Result", robots: { index: false } };

export default async function ResultPage({ params }: PageProps<"/results/[runId]">) {
  const runId = z.uuid().safeParse((await params).runId);
  const db = getDb();
  if (!runId.success || !db) notFound();
  const [run] = await db.select().from(runs).where(eq(runs.id, runId.data));
  if (!run) notFound();

  // The page shows what a replay of the stored log says, not a stored summary of it.
  const replayed = replay(run.spec, run.actionLog);
  const modules = replayed.ok ? replayed.state.modules : [];
  const strikeLog = replayed.ok ? replayed.state.strikeLog : [];
  const mission = run.missionId ? missionById(run.missionId) : undefined;
  const defused = run.result === "defused";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p
        className={`font-display text-sm font-semibold tracking-widest uppercase ${defused ? "text-mint-text" : "text-tomato-text"}`}
      >
        {mission ? mission.title : "Freeplay"} · {run.createdAt.toISOString().slice(0, 10)}
      </p>
      <h1 className="mt-1 font-display text-5xl font-bold tracking-tight text-balance">
        {defused ? `${run.defuserName} defused it.` : run.reason}
      </h1>
      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          ["Time left", formatDuration(run.timeRemainingMs)],
          ["Strikes", `${run.strikes} / ${run.spec.strikeLimit}`],
          ["Manual", String(run.ruleSeed)],
        ].map(([label, value]) => (
          <div key={label} className="sticker rounded-2xl bg-card px-4 py-3">
            <dt className="text-xs font-bold tracking-widest text-muted uppercase">{label}</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-bold">
        {run.verified
          ? "Verified: the server replayed this run from its action log."
          : "Not verified. This run does not count on leaderboards."}
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold">Modules</h2>
      <ul className="mt-2 divide-y-2 divide-line/20">
        {modules.map((m, i) => {
          const strikes = strikeLog.filter((s) => s.moduleIndex === i).length;
          const def = MODULES[m.id as ModuleId];
          return (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="font-bold">{def.name}</span>
              <span className="text-sm text-muted">
                {def.kind === "needy"
                  ? "needy"
                  : m.solvedAtMs !== null
                    ? `solved at ${formatDuration(m.solvedAtMs)}`
                    : "not solved"}
                {strikes > 0 && ` · ${strikes} ${strikes === 1 ? "strike" : "strikes"}`}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={mission ? `/bomb?mission=${mission.id}` : "/play"}
          className="sticker sticker-press rounded-full bg-tomato px-7 py-3 font-display text-lg font-semibold text-white"
        >
          {mission ? "Play this mission" : "Play"}
        </Link>
        {mission && (
          <Link
            href={`/leaderboard?mission=${mission.id}`}
            className="sticker sticker-press rounded-full bg-card px-7 py-3 font-display text-lg font-semibold"
          >
            Leaderboard
          </Link>
        )}
      </div>
    </div>
  );
}
