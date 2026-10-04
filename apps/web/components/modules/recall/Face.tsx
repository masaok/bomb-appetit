"use client";

import type { RecallAction, RecallState } from "@bombappetit/engine/modules/recall";
import type { ModuleFaceProps } from "../types";

const KEY_W = 58;
const KEY_H = 104;

export function Face({ state, solved, dispatch }: ModuleFaceProps<RecallState, RecallAction>) {
  const total = state.stages.length;
  const done = Math.min(state.history.length, total);
  // once solved there is no next stage, so the last one stays on screen
  const stage = state.stages[Math.min(state.history.length, total - 1)];
  const locked = solved || state.history.length >= total;

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Recall">
      <rect x="18" y="16" width="218" height="132" rx="14" fill="#15101f" />
      <rect x="24" y="22" width="206" height="120" rx="9" fill="#2a1508" stroke="#ffc94a" strokeWidth="2" />
      <text
        x="127"
        y="118"
        textAnchor="middle"
        fontSize="104"
        fontWeight="700"
        fill="#ffc94a"
        className="font-mono"
        aria-label={`Display: ${locked ? "done" : (stage?.display ?? "")}`}
      >
        {locked ? "-" : stage?.display}
      </text>

      <g role="img" aria-label={`${done} of ${total} stages complete`}>
        <rect x="246" y="16" width="36" height="132" rx="10" fill="#15101f" />
        {state.stages.map((_, i) => {
          // lights fill from the bottom, like a level meter
          const lit = total - 1 - i < done;
          return (
            <rect
              key={i}
              x="252"
              y={23 + i * 24.5}
              width="24"
              height="20"
              rx="5"
              fill={lit ? "#5fd3a6" : "#3a2f5c"}
              stroke={lit ? "#fff6e9" : "none"}
              strokeWidth="1.5"
            />
          );
        })}
      </g>

      {stage?.labels.map((label, i) => {
        const x = 18 + i * (KEY_W + 10.67);
        const y = 166;
        return (
          <g
            key={i}
            role="button"
            tabIndex={locked ? -1 : 0}
            aria-label={`Button ${label}, position ${i + 1}`}
            aria-disabled={locked}
            className={locked ? "opacity-60" : "group cursor-pointer focus-visible:outline-2"}
            onClick={() => dispatch({ type: "press", position: i })}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                dispatch({ type: "press", position: i });
              }
            }}
          >
            <rect x={x} y={y + 8} width={KEY_W} height={KEY_H} rx="14" fill="#15101f" />
            <g className="motion-safe:transition-transform group-active:translate-y-[5px]">
              <rect x={x} y={y} width={KEY_W} height={KEY_H} rx="14" fill="#fff6e9" stroke="#15101f" strokeWidth="3" />
              <text
                x={x + KEY_W / 2}
                y={y + KEY_H / 2 + 20}
                textAnchor="middle"
                fontSize="58"
                fontWeight="700"
                fill="#15101f"
                className="font-display select-none"
              >
                {label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
