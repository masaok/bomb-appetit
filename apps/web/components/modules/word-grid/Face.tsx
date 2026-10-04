"use client";

import {
  WORD_GRID_POSITIONS,
  type WordGridAction,
  type WordGridState,
} from "@bombappetit/engine/modules/word-grid";
import type { ModuleFaceProps } from "../types";

const KEY_W = 126;
const KEY_H = 54;

export function Face({ state, solved, dispatch }: ModuleFaceProps<WordGridState, WordGridAction>) {
  const total = state.stages.length;
  const done = Math.min(state.stage, total);
  // once solved there is no next stage, so the last one stays on screen
  const stage = state.stages[Math.min(state.stage, total - 1)];
  const locked = solved || state.stage >= total;

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Word Grid">
      <rect x="18" y="16" width="218" height="60" rx="12" fill="#15101f" />
      <rect x="23" y="21" width="208" height="50" rx="8" fill="#0c2a22" stroke="#5fd3a6" strokeWidth="2" />
      <text
        x="127"
        y="56"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        letterSpacing="2"
        fill="#5fd3a6"
        className="font-mono"
        aria-label={`Display: ${locked ? "done" : (stage?.display ?? "")}`}
      >
        {locked ? "- - -" : stage?.display}
      </text>

      <g role="img" aria-label={`${done} of ${total} stages complete`}>
        <rect x="246" y="16" width="36" height="60" rx="10" fill="#15101f" />
        {state.stages.map((_, i) => {
          // lights fill from the bottom, like a level meter
          const lit = total - 1 - i < done;
          return (
            <rect
              key={i}
              x="252"
              y={22 + i * 17}
              width="24"
              height="13"
              rx="4"
              fill={lit ? "#ffc94a" : "#3a2f5c"}
              stroke={lit ? "#fff6e9" : "none"}
              strokeWidth="1.5"
            />
          );
        })}
      </g>

      {stage?.buttons.map((word, i) => {
        const x = 18 + (i % 2) * (KEY_W + 12);
        const y = 92 + Math.floor(i / 2) * (KEY_H + 14);
        return (
          <g
            key={i}
            role="button"
            tabIndex={locked ? -1 : 0}
            aria-label={`${word}, ${WORD_GRID_POSITIONS[i]}`}
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
            <rect x={x} y={y + 6} width={KEY_W} height={KEY_H} rx="12" fill="#15101f" />
            <g className="motion-safe:transition-transform group-active:translate-y-[4px]">
              <rect x={x} y={y} width={KEY_W} height={KEY_H} rx="12" fill="#fff6e9" stroke="#15101f" strokeWidth="3" />
              <text
                x={x + KEY_W / 2}
                y={y + KEY_H / 2 + 7}
                textAnchor="middle"
                fontSize={word.length > 6 ? 17 : 21}
                fontWeight="700"
                fill="#15101f"
                className="font-display select-none"
              >
                {word}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
