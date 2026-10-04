"use client";

import { MODULES, summarize, type BombState } from "@bombappetit/engine";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatDuration } from "./format";

export type SaveState =
  | { kind: "saving" }
  | {
      kind: "saved";
      runId: string | null;
      verified: boolean;
      /** The run's place on its leaderboard. "guest" means it would be ranked after signing in. */
      standing: { rank: number; total: number; topPercent: number } | "guest" | null;
    }
  | { kind: "failed"; message: string };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sticker rounded-2xl bg-card px-4 py-3 text-center">
      <dt className="text-xs font-bold tracking-widest text-muted uppercase">{label}</dt>
      <dd className="font-display text-3xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** Shown when the bomb is defused or has exploded: what happened, and what killed you. */
export function ResultsPanel({
  bomb,
  save,
  actions,
}: {
  bomb: BombState;
  save: SaveState;
  actions: ReactNode;
}) {
  const summary = summarize(bomb);
  const defused = summary.result === "defused";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10" role="status" aria-live="polite">
      <p
        className={`font-display text-sm font-semibold tracking-widest uppercase ${defused ? "text-mint-text" : "text-tomato-text"}`}
      >
        {defused ? "Bomb defused" : "Boom"}
      </p>
      <h1 className="mt-1 font-display text-5xl font-bold tracking-tight text-balance">
        {defused ? "Dinner is saved." : summary.reason}
      </h1>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Time left" value={formatDuration(summary.timeRemainingMs)} />
        <Stat label="Strikes" value={`${summary.strikes} / ${bomb.spec.strikeLimit}`} />
        <Stat label="Played" value={formatDuration(summary.elapsedMs)} />
      </dl>

      <h2 className="mt-8 font-display text-xl font-semibold">Modules</h2>
      <ul className="mt-2 divide-y-2 divide-line/20">
        {bomb.modules.map((m, i) => {
          const strikes = bomb.strikeLog.filter((s) => s.moduleIndex === i).length;
          const needy = MODULES[m.id].kind === "needy";
          return (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="font-bold">{MODULES[m.id].name}</span>
              <span className="text-sm text-muted">
                {needy
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

      <p className="mt-6 text-sm text-muted">
        {save.kind === "saving" && "Checking the run with the server…"}
        {save.kind === "failed" && save.message}
        {save.kind === "saved" &&
          save.runId === null &&
          "This server has no database, so the run was checked but not saved."}
        {save.kind === "saved" && save.runId !== null && (
          <>
            {save.verified
              ? "Run verified by server replay. "
              : "Run saved. It did not pass verification, so it will not appear on leaderboards. "}
            {save.standing === "guest" && "Sign in before your next run to rank it on the leaderboard. "}
            {save.standing && save.standing !== "guest" && (
              <strong className="text-ink">
                You are #{save.standing.rank} of {save.standing.total} on this mission, in the top{" "}
                {save.standing.topPercent}%.{" "}
              </strong>
            )}
            <Link href={`/results/${save.runId}`} className="font-bold underline">
              Shareable result
            </Link>
          </>
        )}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
    </div>
  );
}
