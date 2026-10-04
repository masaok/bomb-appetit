"use client";

import { regularModules, remainingMs, solvedCount, type BombSpec } from "@bombappetit/engine";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AudioControls } from "@/components/hud/AudioControls";
import { ResultsPanel, type SaveState } from "@/components/hud/ResultsPanel";
import { initAudio, playSfx } from "@/lib/audio/player";
import { needyActive } from "@/lib/needy";
import type { GameStatus } from "@/lib/realtime/adapter";
import { useGame } from "@/store/game";
import { BombNet, readoutOf } from "./BombNet";

const Bomb3D = dynamic(() => import("@/components/bomb3d/Bomb3D").then((m) => m.Bomb3D), {
  ssr: false,
  loading: () => <p className="py-20 text-center text-[#b9b0d0]">Loading the 3D bomb…</p>,
});

export interface ArmedRun {
  spec: BombSpec;
  ticket: string;
  resumeKey: string;
}

type ViewMode = "2d" | "3d";

function preferredView(): ViewMode {
  try {
    const saved = localStorage.getItem("ba:view");
    if (saved === "2d" || saved === "3d") return saved;
  } catch {
    // Fall through to the device default.
  }
  // Phones and low-core devices start on the flat view; anyone can switch.
  const small = window.matchMedia("(max-width: 900px)").matches;
  return small || (navigator.hardwareConcurrency ?? 8) <= 4 ? "2d" : "3d";
}

// The preference is read once per mount; switching views is tracked in component state.
const subscribeNever = () => () => {};
const serverView = (): ViewMode => "2d";

/**
 * The Defuser's screen. Runs the engine locally, plays sounds from state changes,
 * and posts the action log for server replay when the bomb is defused or explodes.
 */
export function BombScreen({
  run,
  onStatus,
  resultActions,
}: {
  run: ArmedRun;
  /** Called about once a second and on every change. Rooms forward it to the Experts. */
  onStatus?: (status: GameStatus) => void;
  resultActions: ReactNode;
}) {
  const game = useGame((s) => s.game);
  const preferred = useSyncExternalStore(subscribeNever, preferredView, serverView);
  const [chosen, setChosen] = useState<ViewMode | null>(null);
  const view = chosen ?? preferred;
  const [save, setSave] = useState<SaveState>({ kind: "saving" });
  const [shake, setShake] = useState(0);

  useEffect(() => {
    void initAudio();
    const { restore, arm } = useGame.getState();
    if (!restore(run.resumeKey)) arm(run.spec, { token: run.ticket, resumeKey: run.resumeKey });
    // 20 Hz keeps blinking codes (250 ms pulses) readable without redrawing more than needed.
    const loop = setInterval(() => useGame.getState().tick(), 50);
    return () => {
      clearInterval(loop);
      useGame.getState().reset();
    };
  }, [run]);

  const bomb = game.kind === "idle" ? null : game.bomb;

  // Sounds and shake are reactions to what changed between two engine states.
  const previous = useRef(bomb);
  useEffect(() => {
    const before = previous.current;
    previous.current = bomb;
    if (!bomb || !before || before === bomb) return;
    if (bomb.phase.kind === "exploded" && before.phase.kind === "armed") return playSfx("explosion");
    if (bomb.phase.kind === "defused" && before.phase.kind === "armed") return playSfx("defused");
    if (bomb.strikes > before.strikes) {
      playSfx("strike");
      setShake((n) => n + 1);
    } else if (solvedCount(bomb) > solvedCount(before)) {
      playSfx("solved");
    } else if (needyActive(bomb) && !needyActive(before)) {
      playSfx("needy");
    } else if (Math.ceil(remainingMs(bomb) / 1000) !== Math.ceil(remainingMs(before) / 1000)) {
      playSfx(remainingMs(bomb) < 60_000 ? "tickFast" : "tick");
    }
  }, [bomb]);

  const statusKey = bomb
    ? `${Math.ceil(remainingMs(bomb) / 1000)}:${bomb.strikes}:${solvedCount(bomb)}:${needyActive(bomb)}:${bomb.phase.kind}`
    : "";
  const reportStatus = useRef(onStatus);
  useEffect(() => {
    reportStatus.current = onStatus;
  });
  useEffect(() => {
    const current = useGame.getState().game;
    if (current.kind === "idle") return;
    reportStatus.current?.({
      remainingMs: remainingMs(current.bomb),
      strikes: current.bomb.strikes,
      strikeLimit: current.bomb.spec.strikeLimit,
      solved: solvedCount(current.bomb),
      total: regularModules(current.bomb).length,
      needyActive: needyActive(current.bomb),
    });
  }, [statusKey]);

  const ended = game.kind === "ended" ? game : null;
  useEffect(() => {
    if (!ended) return;
    let cancelled = false;
    fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: ended.ticket.token, log: ended.log }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) return;
        setSave(
          response.ok
            ? { kind: "saved", runId: body.runId, verified: body.verified }
            : { kind: "failed", message: body.error ?? "The server rejected this run." },
        );
      })
      .catch(() => {
        if (!cancelled) setSave({ kind: "failed", message: "Could not reach the server to save this run." });
      });
    return () => {
      cancelled = true;
    };
  }, [ended]);

  if (!bomb) return <p className="py-24 text-center text-muted">Arming the bomb…</p>;

  if (ended) {
    return (
      <>
        {bomb.phase.kind === "exploded" && <div aria-hidden className="whiteout pointer-events-none fixed inset-0 z-50 bg-white" />}
        <ResultsPanel bomb={bomb} save={save} actions={resultActions} />
      </>
    );
  }

  const readout = readoutOf(bomb);
  const chooseView = (mode: ViewMode) => {
    setChosen(mode);
    try {
      localStorage.setItem("ba:view", mode);
    } catch {
      // The choice just will not be remembered.
    }
  };

  return (
    <div className="min-h-screen bg-[#191329] pb-10">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#15101f] bg-[#221a38] px-4 py-2 text-[#fff6e9]">
        <div className="flex items-center gap-4" role="timer" aria-label={`Time left ${readout.timerText}`}>
          <span className="font-mono text-3xl font-bold text-tomato tabular-nums">{readout.timerText}</span>
          <span className="text-sm font-bold">
            Strikes {bomb.strikes}/{bomb.spec.strikeLimit}
          </span>
          <span className="text-sm font-bold">
            Solved {solvedCount(bomb)}/{regularModules(bomb).length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-full border-2 border-[#15101f]" role="group" aria-label="Bomb view">
            {(["2d", "3d"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                onClick={() => chooseView(mode)}
                className={`px-3 py-1 text-sm font-bold uppercase ${view === mode ? "bg-sun text-night" : "bg-[#3a2f5c]"}`}
              >
                {mode}
              </button>
            ))}
          </div>
          <AudioControls />
        </div>
      </header>
      <div key={shake} className={`mx-auto max-w-6xl px-3 pt-4 ${shake > 0 ? "bomb-shake" : ""}`}>
        {view === "3d" ? (
          <Bomb3D bomb={bomb} dispatch={useGame.getState().dispatch} />
        ) : (
          <BombNet bomb={bomb} dispatch={useGame.getState().dispatch} />
        )}
      </div>
    </div>
  );
}
