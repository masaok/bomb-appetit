"use client";

import {
  DISCHARGE_LEVER_FULL,
  DISCHARGE_LEVER_PRESS_ABOVE,
  dischargeLeverLevel,
  dischargeLeverPercent,
  type DischargeLeverAction,
  type DischargeLeverState,
} from "@bombappetit/engine/modules/discharge-lever";
import { HoldButton } from "@/components/bomb/HoldButton";
import type { ModuleFaceProps } from "../types";

const WARN_AT = (DISCHARGE_LEVER_PRESS_ABOVE * 100) / DISCHARGE_LEVER_FULL;

export function Face({ state, bomb, dispatch }: ModuleFaceProps<DischargeLeverState, DischargeLeverAction>) {
  const running = state.kind === "running";
  const held = running && state.held;
  const level = dischargeLeverLevel(state, bomb.elapsedMs);
  const percent = dischargeLeverPercent(state, bomb.elapsedMs);
  const high = level > DISCHARGE_LEVER_PRESS_ABOVE;

  return (
    <div
      role="group"
      aria-label="Discharge Lever"
      className={`flex size-full items-stretch gap-4 p-4 text-[#fff6e9] ${running ? "" : "opacity-45 saturate-50"}`}
    >
      <div className="flex w-[104px] flex-col items-center gap-2">
        <div
          role="meter"
          aria-label="Charge"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="relative w-[72px] flex-1 overflow-hidden rounded-2xl border-[3px] border-[#15101f] bg-[#15101f] shadow-[inset_0_0_0_3px_#3a2f5c]"
        >
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: `${(level * 100) / DISCHARGE_LEVER_FULL}%`, background: high ? "#f04a3a" : "#ffc94a" }}
          />
          {/* the danger line sits where the fill changes color, so the threshold reads without color */}
          <div
            className="absolute inset-x-0 border-t-[3px] border-dashed border-[#fff6e9]"
            style={{ bottom: `${WARN_AT}%` }}
          />
          {[25, 50, 75].map((mark) => (
            <div key={mark} className="absolute left-0 h-[2px] w-3 bg-[#fff6e9]/60" style={{ bottom: `${mark}%` }} />
          ))}
        </div>
        <div className="w-full rounded-lg border-[3px] border-[#15101f] bg-[#15101f] py-1 text-center font-mono text-2xl leading-none font-bold tabular-nums">
          <span className={high ? "text-[#f04a3a]" : "text-[#ffc94a]"}>{running ? `${percent}%` : "--"}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 pt-8">
        <p className="h-6 font-display text-lg leading-none font-bold tracking-wide uppercase">
          {!running ? "Z z z" : held ? "Draining" : high ? "Pull now!" : "Charging"}
        </p>
        <HoldButton
          aria-label="Discharge lever"
          aria-pressed={held}
          disabled={!running}
          onPress={() => dispatch({ type: "press" })}
          onRelease={() => dispatch({ type: "release" })}
          className="relative w-full flex-1 rounded-2xl border-[3px] border-[#15101f] bg-[#3a2f5c] select-none enabled:cursor-grab enabled:active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff6e9]"
        >
          <span aria-hidden className="absolute inset-y-4 left-1/2 w-5 -translate-x-1/2 rounded-full bg-[#15101f]" />
          <span
            aria-hidden
            className="absolute inset-x-3 flex h-14 items-center justify-center rounded-xl border-[3px] border-[#15101f] bg-[#f04a3a] font-display text-lg font-bold text-white uppercase shadow-[0_5px_0_#15101f] motion-safe:transition-[top] motion-safe:duration-100"
            style={{ top: held ? "calc(100% - 72px)" : "12px" }}
          >
            {held ? "Held" : "Hold"}
          </span>
        </HoldButton>
      </div>
    </div>
  );
}
