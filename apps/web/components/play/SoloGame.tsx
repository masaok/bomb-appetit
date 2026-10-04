"use client";

import type { BombSpec } from "@bombappetit/engine";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BombScreen } from "@/components/bomb/BombScreen";
import { formatDuration } from "@/components/hud/format";
import { initAudio } from "@/lib/audio/player";

type Deal =
  | { kind: "loading" }
  | { kind: "ready"; spec: BombSpec; ticket: string }
  | { kind: "armed"; spec: BombSpec; ticket: string }
  | { kind: "error"; message: string };

const button = "sticker sticker-press rounded-full px-7 py-3 font-display text-lg font-semibold";

/**
 * Solo and same-room play: asks the server for a bomb, shows a briefing, then hands
 * over to the bomb screen. `start` is the body for POST /api/runs/start.
 */
export function SoloGame({ start, title, backHref }: { start: object; title: string; backHref: string }) {
  const [deal, setDeal] = useState<Deal>({ kind: "loading" });
  const [round, setRound] = useState(0);
  const startKey = JSON.stringify(start);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/runs/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: startKey })
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) return;
        setDeal(
          response.ok
            ? { kind: round === 0 ? "ready" : "armed", spec: body.spec, ticket: body.ticket }
            : { kind: "error", message: body.error ?? "Could not start a bomb." },
        );
      })
      .catch(() => {
        if (!cancelled) setDeal({ kind: "error", message: "Could not reach the server." });
      });
    return () => {
      cancelled = true;
    };
  }, [startKey, round]);

  if (deal.kind === "loading") return <p className="py-24 text-center text-muted">Dealing a bomb…</p>;

  if (deal.kind === "error") {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p role="alert" className="font-display text-2xl font-semibold">
          {deal.message}
        </p>
        <Link href={backHref} className={`${button} mt-6 inline-block bg-sun text-night`}>
          Back
        </Link>
      </div>
    );
  }

  if (deal.kind === "ready") {
    const { spec } = deal;
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="font-display text-sm font-semibold tracking-widest text-tomato uppercase">Briefing</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight text-balance">{title}</h1>
        <p className="mt-4 text-lg text-muted">
          {spec.moduleCount} {spec.moduleCount === 1 ? "module" : "modules"}
          {spec.needyCount > 0 && ` plus ${spec.needyCount} needy`} · {formatDuration(spec.timeLimitMs)} on the clock ·{" "}
          {spec.strikeLimit === 1 ? "one strike and it blows" : `${spec.strikeLimit} strikes and it blows`}
        </p>
        <p className="mt-4 text-lg">
          Experts open{" "}
          <Link href={`/manual/${spec.ruleSeed}`} target="_blank" className="font-bold underline">
            manual {spec.ruleSeed}
          </Link>
          . They must not see this screen.
        </p>
        <button
          type="button"
          className={`${button} mt-8 bg-tomato text-white`}
          onClick={() => {
            void initAudio();
            setDeal({ ...deal, kind: "armed" });
          }}
        >
          Arm the bomb
        </button>
      </div>
    );
  }

  return (
    <BombScreen
      run={{ spec: deal.spec, ticket: deal.ticket, resumeKey: `solo:${startKey}:${round}` }}
      resultActions={
        <>
          <button
            type="button"
            className={`${button} bg-tomato text-white`}
            onClick={() => {
              setDeal({ kind: "loading" });
              setRound((n) => n + 1);
            }}
          >
            Play again
          </button>
          <Link href={backHref} className={`${button} bg-card`}>
            Change setup
          </Link>
        </>
      }
    />
  );
}
