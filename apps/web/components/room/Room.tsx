"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BombScreen } from "@/components/bomb/BombScreen";
import { formatDuration } from "@/components/hud/format";
import { Logo } from "@/components/logo";
import { FreeplayFields } from "@/components/play/FreeplayFields";
import { DEFAULT_FREEPLAY } from "@/lib/freeplay";
import { roomChannel, type GameStatus } from "@/lib/realtime/adapter";
import { realtimeClient } from "@/lib/realtime/client";
import type { RoomOp, RoomSetup, RoomView } from "@/lib/rooms";
import { ExpertBar } from "./ExpertBar";

const button =
  "sticker sticker-press rounded-full px-6 py-2.5 font-display text-lg font-semibold disabled:opacity-50";

export interface MissionOption {
  id: string;
  label: string;
}

/** `at` is when the view arrived, on this device's clock. The Expert countdown runs forward from it. */
type Load =
  { kind: "loading" } | { kind: "missing"; message: string } | { kind: "ready"; view: RoomView; at: number };

export function Room({ code, missions }: { code: string; missions: MissionOption[] }) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [online, setOnline] = useState<string[] | null>(null);
  const [pushed, setPushed] = useState<{ status: GameStatus; at: number } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
      const body = await response.json();
      setLoad(
        response.ok
          ? { kind: "ready", view: body, at: performance.now() }
          : { kind: "missing", message: body.error ?? "Room not found." },
      );
    } catch {
      // A dropped poll is retried by the next one.
    }
  }, [code]);

  const send = useCallback(
    async (op: RoomOp) => {
      setError(null);
      try {
        const response = await fetch(`/api/rooms/${code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op),
        });
        const body = await response.json();
        if (!response.ok) setError(body.error ?? "That did not work.");
        else if (op.op !== "status") setLoad({ kind: "ready", view: body, at: performance.now() });
      } catch {
        if (op.op !== "status") setError("Could not reach the server.");
      }
    },
    [code],
  );

  const view = load.kind === "ready" ? load.view : null;
  const member = view?.you ?? null;
  const memberId = member?.id;

  // Polling is the baseline. With a realtime provider it only backs up missed pushes.
  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, realtimeClient && memberId ? 10_000 : 2_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh, memberId]);

  useEffect(() => {
    if (!realtimeClient || !memberId) return;
    return realtimeClient.subscribe(
      roomChannel(code),
      (message) => {
        if (message.event === "game:status")
          return setPushed({ status: message.payload, at: performance.now() });
        // Any other event starts or ends a game or changes the lobby: old status is stale.
        setPushed(null);
        void refresh();
      },
      setOnline,
    );
  }, [code, memberId, refresh]);

  // A pushed status is at most a second old. Without pushes, the last poll is the freshest.
  const polled =
    load.kind === "ready" && load.view.lastStatus ? { status: load.view.lastStatus, at: load.at } : null;
  const liveStatus = pushed ?? polled;

  const reportStatus = useCallback((status: GameStatus) => void send({ op: "status", status }), [send]);

  if (load.kind === "loading") return <p className="py-24 text-center text-muted">Finding room {code}…</p>;
  if (load.kind === "missing" || !view) {
    return (
      <Shell code={code}>
        <p role="alert" className="font-display text-2xl font-semibold">
          {load.kind === "missing" ? load.message : "Room not found."}
        </p>
        <Link href="/play" className={`${button} mt-6 inline-block bg-sun text-night`}>
          Create a new room
        </Link>
      </Shell>
    );
  }

  if (!member) {
    return (
      <Shell code={code}>
        <h1 className="font-display text-4xl font-bold">Join room {code}</h1>
        <p className="mt-2 text-muted">
          {view.players.length} {view.players.length === 1 ? "player is" : "players are"} already here.
        </p>
        <form
          className="mt-6 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send({ op: "join", name });
          }}
        >
          <label className="grid gap-1">
            <span className="text-sm font-bold">Your name</span>
            <input
              required
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sticker rounded-xl bg-card px-3 py-2 font-bold"
              autoComplete="nickname"
            />
          </label>
          <button type="submit" className={`${button} bg-tomato text-white`}>
            Join
          </button>
        </form>
        <ErrorLine error={error} />
      </Shell>
    );
  }

  if (view.status === "armed" && member.role === "defuser" && view.defuser) {
    return (
      <BombScreen
        run={{
          spec: view.defuser.spec,
          ticket: view.defuser.ticket,
          resumeKey: `room:${code}:${view.startedAt}`,
        }}
        onStatus={reportStatus}
        resultActions={
          <p className="font-bold">
            {member.isHost ? "Go back to the lobby from the room page." : "Waiting for the host."}
          </p>
        }
      />
    );
  }

  if (view.status === "armed") {
    return (
      <div className="flex min-h-screen flex-col">
        <ExpertBar live={liveStatus} />
        <iframe
          src={`/manual/${view.ruleSeed}`}
          title={`Manual ${view.ruleSeed}`}
          className="w-full flex-1 border-0"
          style={{ minHeight: "calc(100vh - 5rem)" }}
        />
      </div>
    );
  }

  const defuser = view.players.find((p) => p.role === "defuser");
  const setup = view.setup;
  const changeSetup = (next: RoomSetup) => void send({ op: "setup", setup: next });

  return (
    <Shell code={code}>
      {view.status === "ended" && view.lastResult && (
        <section className="sticker mb-8 rounded-3xl bg-card p-5" aria-live="polite">
          <p
            className={`font-display text-sm font-semibold tracking-widest uppercase ${view.lastResult.result === "defused" ? "text-mint-text" : "text-tomato-text"}`}
          >
            Last game
          </p>
          <p className="font-display text-3xl font-semibold">
            {view.lastResult.result === "defused" ? "Defused" : view.lastResult.reason}
            {view.lastResult.result === "defused" &&
              ` with ${formatDuration(view.lastResult.timeRemainingMs)} left`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {view.lastResult.strikes} {view.lastResult.strikes === 1 ? "strike" : "strikes"} ·{" "}
            {view.lastResult.verified ? "verified by server replay" : "not verified"} ·{" "}
            <Link href={`/results/${view.lastResult.runId}`} className="font-bold underline">
              details
            </Link>
          </p>
        </section>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-widest text-muted uppercase">Room code</p>
          <p
            className="font-mono text-6xl font-bold tracking-[0.25em]"
            aria-label={`Room code ${code.split("").join(" ")}`}
          >
            {code}
          </p>
        </div>
        <p className="max-w-xs text-sm text-muted">
          Read the code aloud, or share this page&apos;s address. Then get on a call: the game does not carry
          your voices.
        </p>
      </div>

      <h2 className="mt-8 font-display text-2xl font-semibold">Players</h2>
      <ul className="mt-3 grid gap-2">
        {view.players.map((player) => (
          <li
            key={player.id}
            className="sticker flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card px-4 py-2"
          >
            <span className="font-bold">
              {player.name}
              {player.id === view.hostId && <span className="ml-2 text-sm text-muted">host</span>}
              {player.id === member.id && <span className="ml-2 text-sm text-muted">you</span>}
              {online && !online.includes(player.id) && <span className="ml-2 text-sm text-muted">away</span>}
            </span>
            <span
              className={`rounded-full border-2 border-night px-3 py-0.5 text-sm font-extrabold text-night ${player.role === "defuser" ? "bg-tomato text-white" : "bg-sun"}`}
            >
              {player.role === "defuser" ? "Defuser" : "Expert"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3">
        {member.role === "expert" ? (
          <button
            type="button"
            disabled={Boolean(defuser)}
            className={`${button} bg-card`}
            onClick={() => void send({ op: "role", role: "defuser" })}
          >
            {defuser ? `${defuser.name} is the Defuser` : "I will be the Defuser"}
          </button>
        ) : (
          <button
            type="button"
            className={`${button} bg-card`}
            onClick={() => void send({ op: "role", role: "expert" })}
          >
            Switch to Expert
          </button>
        )}
      </div>

      <h2 className="mt-8 font-display text-2xl font-semibold">Bomb</h2>
      {member.isHost ? (
        <div className="mt-3 grid gap-4">
          <label className="grid max-w-md gap-1">
            <span className="text-sm font-bold">What to play</span>
            <select
              className="sticker rounded-xl bg-card px-3 py-2 font-bold"
              value={setup.kind === "mission" ? setup.missionId : ""}
              onChange={(e) =>
                changeSetup(
                  e.target.value
                    ? { kind: "mission", missionId: e.target.value }
                    : { kind: "freeplay", config: DEFAULT_FREEPLAY },
                )
              }
            >
              <option value="">Freeplay (custom)</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {setup.kind === "freeplay" && (
            <FreeplayFields
              config={setup.config}
              onChange={(config) => changeSetup({ kind: "freeplay", config })}
            />
          )}
        </div>
      ) : (
        <p className="mt-2 text-muted">
          {setup.kind === "mission"
            ? `Mission: ${missions.find((m) => m.id === setup.missionId)?.label ?? setup.missionId}`
            : `Freeplay: ${setup.config.moduleCount} modules, ${formatDuration(setup.config.timeLimitMs)}, ${setup.config.strikeLimit} strikes`}
          . The host picks.
        </p>
      )}
      <p className="mt-4">
        Experts will use{" "}
        <Link href={`/manual/${view.ruleSeed}`} target="_blank" className="font-bold underline">
          manual {view.ruleSeed}
        </Link>
        .
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {member.isHost ? (
          <button
            type="button"
            disabled={!defuser}
            className={`${button} bg-tomato text-white`}
            onClick={() => void send({ op: "start" })}
          >
            Arm the bomb
          </button>
        ) : (
          <p className="font-bold">Waiting for the host to arm the bomb.</p>
        )}
        <button type="button" className="font-bold underline" onClick={() => void send({ op: "leave" })}>
          Leave room
        </button>
      </div>
      <ErrorLine error={error} />
    </Shell>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="mt-4 font-bold text-tomato-text">
      {error}
    </p>
  ) : null;
}

function Shell({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <header className="flex items-center justify-between">
        <Logo className="text-xl" />
        <span className="font-mono font-bold tracking-widest text-muted">{code}</span>
      </header>
      <main className="pt-10 pb-20">{children}</main>
    </div>
  );
}
