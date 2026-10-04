"use client";

import { useEffect, useState } from "react";
import { Mascot } from "./mascot";

const START_SECONDS = 5 * 60;

const LINES = [
  "Hi, I'm Fizz! Please don't cut the red one.",
  "Boop! That tickles.",
  "Was that a strike? I felt a strike.",
  "Is the manual upside down?",
  "I believe in you. Mostly.",
  "No pressure. Okay, a little pressure.",
  "Tick tock, chef!",
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function HeroMascot() {
  const [seconds, setSeconds] = useState(START_SECONDS);
  const [boops, setBoops] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s <= 1 ? START_SECONDS : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute inset-x-6 top-10 bottom-4 rounded-full bg-sun" />
      <div aria-hidden className="absolute right-2 top-16 size-10 rounded-full bg-mint" />
      <div aria-hidden className="absolute right-4 bottom-10 size-6 rounded-full bg-sky" />

      <button
        type="button"
        onClick={() => setBoops((n) => n + 1)}
        aria-label="Boop Fizz the bomb"
        className="relative block w-full cursor-pointer rounded-full outline-offset-4 focus-visible:outline-4 focus-visible:outline-tomato"
      >
        {/* Re-keying restarts the squish animation on every boop. */}
        <span key={boops} className={`block ${boops ? "mascot-boop" : ""}`}>
          <Mascot decorative className="mx-auto h-auto w-4/5" />
        </span>
      </button>

      <p
        aria-live="polite"
        className="sticker absolute -top-2 left-0 max-w-[13rem] rounded-2xl rounded-br-sm bg-card px-4 py-2 text-left text-sm font-bold"
      >
        {LINES[boops % LINES.length]}
      </p>

      <div
        aria-hidden
        className="sticker absolute bottom-6 left-0 -rotate-6 rounded-xl bg-night px-3 py-1.5 font-mono text-xl font-bold tabular-nums text-tomato-text"
      >
        {formatTime(seconds)}
      </div>
    </div>
  );
}
