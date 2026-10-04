"use client";

import { GAME_COLORS } from "../colors";
import type { WiresAction, WiresState } from "@bombappetit/engine/modules/wires";
import type { ModuleFaceProps } from "../types";

export function Face({ state, solved, dispatch }: ModuleFaceProps<WiresState, WiresAction>) {
  const gap = 240 / (state.wires.length + 1);

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Wires">
      <rect x="18" y="24" width="34" height="252" rx="8" fill="#3a2f5c" />
      <rect x="248" y="24" width="34" height="252" rx="8" fill="#3a2f5c" />
      {state.wires.map((color, i) => {
        const y = 30 + gap * (i + 1);
        const cut = state.cut[i] === true;
        const { hex, name, letter, ink } = GAME_COLORS[color];
        const bend = i % 2 === 0 ? -10 : 10;
        return (
          <g
            key={i}
            role="button"
            tabIndex={cut || solved ? -1 : 0}
            aria-label={`Wire ${i + 1}, ${name}${cut ? ", cut" : ""}`}
            aria-disabled={cut || solved}
            className={cut || solved ? "" : "cursor-pointer focus-visible:outline-2"}
            onClick={() => dispatch({ type: "cut", index: i })}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                dispatch({ type: "cut", index: i });
              }
            }}
          >
            {/* wide invisible stroke so thin wires are easy to hit */}
            <path d={`M52 ${y}Q150 ${y + bend} 248 ${y}`} stroke="transparent" strokeWidth="26" fill="none" />
            {cut ? (
              <>
                <path d={`M52 ${y}Q95 ${y + bend} 128 ${y + bend - 8}`} stroke="#15101f" strokeWidth="11" fill="none" strokeLinecap="round" />
                <path d={`M52 ${y}Q95 ${y + bend} 128 ${y + bend - 8}`} stroke={hex} strokeWidth="7" fill="none" strokeLinecap="round" />
                <path d={`M172 ${y + bend + 8}Q205 ${y + bend} 248 ${y}`} stroke="#15101f" strokeWidth="11" fill="none" strokeLinecap="round" />
                <path d={`M172 ${y + bend + 8}Q205 ${y + bend} 248 ${y}`} stroke={hex} strokeWidth="7" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d={`M52 ${y}Q150 ${y + bend} 248 ${y}`} stroke="#15101f" strokeWidth="11" fill="none" />
                <path d={`M52 ${y}Q150 ${y + bend} 248 ${y}`} stroke={hex} strokeWidth="7" fill="none" />
              </>
            )}
            <circle cx="35" cy={y} r="11" fill={hex} stroke="#15101f" strokeWidth="2" />
            <text x="35" y={y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={ink}>
              {letter}
            </text>
            <text x="265" y={y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff6e9">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
