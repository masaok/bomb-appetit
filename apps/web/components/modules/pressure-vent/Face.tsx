"use client";

import type { PressureVentAction, PressureVentState } from "@bombappetit/engine/modules/pressure-vent";
import type { ModuleFaceProps } from "../types";

const ANSWERS = [
  { yes: true, label: "Yes", mark: "M6 14l6 6L24 7", fill: "#5fd3a6" },
  { yes: false, label: "No", mark: "M7 7l16 16M23 7L7 23", fill: "#ff8fa3" },
] as const;

export function Face({ state, bomb, dispatch }: ModuleFaceProps<PressureVentState, PressureVentAction>) {
  const active = state.kind === "active";
  const secondsLeft = active ? Math.max(0, Math.ceil((state.deadlineMs - bomb.elapsedMs) / 1000)) : null;
  const urgent = secondsLeft !== null && secondsLeft <= 10;

  return (
    <div
      role="group"
      aria-label="Pressure Vent"
      className={`flex size-full flex-col gap-3 p-4 text-[#fff6e9] ${active ? "" : "opacity-60 saturate-50"}`}
    >
      <div className="flex items-center gap-3 pr-10">
        <div
          role="timer"
          aria-label={secondsLeft === null ? "Countdown, asleep" : `Countdown, ${secondsLeft} seconds left`}
          className={`w-20 rounded-lg border-[3px] border-[#15101f] bg-[#15101f] py-1 text-center font-mono text-4xl leading-none font-bold tabular-nums ${
            urgent ? "text-[#f04a3a] motion-safe:animate-pulse" : "text-[#ffc94a]"
          }`}
        >
          {secondsLeft === null ? "--" : String(secondsLeft).padStart(2, "0")}
        </div>
        {/* vent slats: open while it is asking, shut while it sleeps */}
        <svg viewBox="0 0 120 44" className="h-11 flex-1" aria-hidden>
          <rect
            x="1.5"
            y="1.5"
            width="117"
            height="41"
            rx="9"
            fill="#3a2f5c"
            stroke="#15101f"
            strokeWidth="3"
          />
          {[10, 20, 30].map((y) => (
            <rect
              key={y}
              x="12"
              y={y - (active ? 3 : 1)}
              width="96"
              height={active ? 6 : 2}
              rx="1"
              fill="#15101f"
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-xl border-[3px] border-[#15101f] bg-[#221a38] px-3 text-center shadow-[inset_0_0_0_2px_#3a2f5c]">
        {active ? (
          <p aria-live="polite" className="font-display text-[26px] leading-tight font-semibold text-balance">
            {state.prompt}
          </p>
        ) : (
          <p className="font-display text-2xl font-semibold tracking-widest">Z z z</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ANSWERS.map(({ yes, label, mark, fill }) => (
          <button
            key={label}
            type="button"
            disabled={!active}
            aria-label={label}
            onClick={() => dispatch({ type: "answer", yes })}
            style={{ background: fill }}
            className="flex h-[72px] items-center justify-center gap-2 rounded-2xl border-[3px] border-[#15101f] font-display text-3xl font-bold text-[#15101f] uppercase shadow-[0_5px_0_#15101f] enabled:cursor-pointer enabled:active:translate-y-1 enabled:active:shadow-[0_1px_0_#15101f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff6e9]"
          >
            <svg viewBox="0 0 30 30" className="size-7" aria-hidden>
              <path
                d={mark}
                fill="none"
                stroke="#15101f"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
