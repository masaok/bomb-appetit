"use client";

import {
  DIAL_ALIGNMENT_DIRECTIONS,
  DIAL_ALIGNMENT_LED_COUNT,
  type DialAlignmentAction,
  type DialAlignmentState,
} from "@bombappetit/engine/modules/dial-alignment";
import type { ModuleFaceProps } from "../types";

export function Face({ state, bomb, dispatch }: ModuleFaceProps<DialAlignmentState, DialAlignmentAction>) {
  const active = state.kind === "active";
  const secondsLeft = active ? Math.max(0, Math.ceil((state.deadlineMs - bomb.elapsedMs) / 1000)) : null;
  const urgent = secondsLeft !== null && secondsLeft <= 10;
  const leds = Array.from({ length: DIAL_ALIGNMENT_LED_COUNT }, (_, i) => active && state.leds[i] === true);
  const quarterTurns = DIAL_ALIGNMENT_DIRECTIONS.indexOf(state.dial);

  return (
    <div
      role="group"
      aria-label="Dial Alignment"
      className={`flex size-full flex-col gap-2.5 p-4 text-[#fff6e9] ${active ? "" : "opacity-60 saturate-50"}`}
    >
      <div className="flex h-11 items-center gap-3 pr-10">
        <div
          role="timer"
          aria-label={secondsLeft === null ? "Countdown, asleep" : `Countdown, ${secondsLeft} seconds left`}
          className={`w-20 rounded-lg border-[3px] border-[#15101f] bg-[#15101f] py-1 text-center font-mono text-4xl leading-none font-bold tabular-nums ${
            urgent ? "text-[#f04a3a] motion-safe:animate-pulse" : "text-[#ffc94a]"
          }`}
        >
          {secondsLeft === null ? "--" : String(secondsLeft).padStart(2, "0")}
        </div>
        <p className="font-display text-lg leading-none font-bold tracking-wide uppercase">
          {active ? `Dial ${state.dial}` : "Z z z"}
        </p>
      </div>

      <div
        role="group"
        aria-label="Lights"
        className="grid h-[84px] grid-cols-6 place-items-center rounded-xl border-[3px] border-[#15101f] bg-[#15101f] px-2 py-1.5 shadow-[inset_0_0_0_2px_#3a2f5c]"
      >
        {leds.map((lit, i) => (
          <span
            key={i}
            role="img"
            aria-label={`Light ${i + 1}, ${lit ? "on" : "off"}`}
            className={`size-7 rounded-full border-[3px] ${
              lit
                ? "border-[#fff6e9] bg-[#ffc94a] shadow-[0_0_10px_2px_#ffc94a]"
                : "border-[#3a2f5c] bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 items-center justify-between gap-3">
        <svg
          viewBox="0 0 120 120"
          className="size-[120px]"
          role="img"
          aria-label={`Dial pointing ${state.dial}`}
        >
          {DIAL_ALIGNMENT_DIRECTIONS.map((direction, i) => (
            <polygon
              key={direction}
              points="60,3 67,14 53,14"
              transform={`rotate(${i * 90} 60 60)`}
              fill={direction === state.dial ? "#fff6e9" : "#5b4b9a"}
            />
          ))}
          <circle cx="60" cy="64" r="40" fill="#15101f" />
          <circle cx="60" cy="60" r="40" fill="#6ec1ff" stroke="#15101f" strokeWidth="3" />
          <g transform={`rotate(${quarterTurns * 90} 60 60)`}>
            <path
              d="M60 26L72 62H48Z"
              fill="#15101f"
              stroke="#15101f"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
          <circle cx="60" cy="60" r="9" fill="#fff6e9" stroke="#15101f" strokeWidth="3" />
        </svg>

        <button
          type="button"
          disabled={!active}
          aria-label="Turn dial clockwise"
          onClick={() => dispatch({ type: "turn" })}
          className="flex h-[92px] flex-1 flex-col items-center justify-center rounded-2xl border-[3px] border-[#15101f] bg-[#ffc94a] font-display text-2xl leading-none font-bold text-[#15101f] uppercase shadow-[0_5px_0_#15101f] enabled:cursor-pointer enabled:active:translate-y-1 enabled:active:shadow-[0_1px_0_#15101f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff6e9]"
        >
          <svg viewBox="0 0 30 30" className="size-9" aria-hidden>
            <path
              d="M7 19a9 9 0 1 1 5 5"
              fill="none"
              stroke="#15101f"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M2 14l5 7 7-5z" fill="#15101f" stroke="#15101f" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Turn
        </button>
      </div>
    </div>
  );
}
