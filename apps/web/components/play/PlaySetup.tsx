"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_FREEPLAY, freeplayToQuery } from "@/lib/freeplay";
import { FreeplayFields } from "./FreeplayFields";

const button = "sticker sticker-press rounded-full px-7 py-3 font-display text-lg font-semibold";

export function PlaySetup({ roomsAvailable }: { roomsAvailable: boolean }) {
  const router = useRouter();
  const [config, setConfig] = useState(DEFAULT_FREEPLAY);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createRoom() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await response.json();
      if (!response.ok) return setError(body.error ?? "Could not create a room.");
      router.push(`/r/${body.code}`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 pb-20">
      <section className="sticker rounded-3xl bg-card p-6" aria-labelledby="online-heading">
        <h2 id="online-heading" className="font-display text-2xl font-semibold">
          Play online with a room code
        </h2>
        <p className="mt-1 text-muted">
          The host creates a room and shares the five-letter code. Experts see the timer and strikes, never
          the bomb.
        </p>
        {roomsAvailable ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void createRoom();
              }}
            >
              <label className="grid gap-1">
                <span className="text-sm font-bold">Your name</span>
                <input
                  required
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sticker rounded-xl bg-page px-3 py-2 font-bold"
                  autoComplete="nickname"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className={`${button} bg-tomato text-white disabled:opacity-60`}
              >
                Create a room
              </button>
            </form>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/r/${joinCode.toUpperCase()}`);
              }}
            >
              <label className="grid gap-1">
                <span className="text-sm font-bold">Room code</span>
                <input
                  required
                  pattern="[A-Za-z]{5}"
                  maxLength={5}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="sticker w-36 rounded-xl bg-page px-3 py-2 font-mono text-xl font-bold tracking-[0.3em] uppercase"
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </label>
              <button type="submit" className={`${button} bg-sun text-night`}>
                Join
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-3 font-bold">
            Rooms are off on this server because it has no database. Solo and same-room play work.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 font-bold text-tomato-text">
            {error}
          </p>
        )}
      </section>

      <section className="sticker rounded-3xl bg-card p-6" aria-labelledby="freeplay-heading">
        <h2 id="freeplay-heading" className="font-display text-2xl font-semibold">
          Freeplay on this device
        </h2>
        <p className="mt-1 text-muted">
          You are the Defuser. Hand the Experts a phone with the manual open, or a printout, and start
          talking.
        </p>
        <div className="mt-5">
          <FreeplayFields config={config} onChange={setConfig} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/bomb?${freeplayToQuery(config)}`} className={`${button} bg-tomato text-white`}>
            Deal me a bomb
          </Link>
          <Link href={`/manual/${config.ruleSeed}`} className={`${button} bg-page`}>
            Open manual {config.ruleSeed}
          </Link>
          <Link href="/missions" className={`${button} bg-page`}>
            Missions
          </Link>
        </div>
      </section>
    </div>
  );
}
