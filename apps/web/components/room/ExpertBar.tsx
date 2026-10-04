"use client";

import { timerText } from "@bombappetit/engine";
import { useEffect, useState } from "react";
import type { GameStatus } from "@/lib/realtime/adapter";

/**
 * Everything an Expert is allowed to see of the bomb: time, strikes, progress and
 * whether a needy module is awake. The countdown runs forward from the Defuser's last
 * report using this device's elapsed time only, so the two clocks never need to agree.
 */
export function ExpertBar({ live }: { live: { status: GameStatus; at: number } | null }) {
  // The clock is read in the interval callback, not during render, so render stays pure.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(timer);
  }, []);

  if (!live) {
    return (
      <div
        className="sticky top-0 z-20 bg-night px-4 py-3 text-center font-bold text-[#fff6e9]"
        role="status"
      >
        Waiting for the Defuser&apos;s bomb…
      </div>
    );
  }

  const { status, at } = live;
  const speed = (4 + status.strikes) / 4;
  const remaining = Math.max(0, status.remainingMs - Math.max(0, now - at) * speed);

  return (
    <div
      className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 border-b-2 border-[#15101f] bg-night px-4 py-2 text-[#fff6e9]"
      role="status"
      aria-label="Bomb status"
    >
      <span className="font-mono text-4xl font-bold text-ember tabular-nums" role="timer">
        {timerText(remaining)}
      </span>
      <span className="font-bold">
        Strikes {status.strikes}/{status.strikeLimit}
      </span>
      <span className="font-bold">
        Solved {status.solved}/{status.total}
      </span>
      {status.needyActive && (
        <span className="rounded-full bg-sun px-3 py-0.5 text-sm font-extrabold text-night">
          Needy module awake
        </span>
      )}
    </div>
  );
}
