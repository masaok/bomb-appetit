"use client";

import {
  WIRE_PANELS_LETTERS,
  type WirePanelsAction,
  type WirePanelsState,
} from "@bombappetit/engine/modules/wire-panels";
import { GAME_COLORS } from "../colors";
import type { ModuleFaceProps } from "../types";

const POST_Y = [88, 140, 192];

type Point = [number, number];

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Path data for the part of a wire between `t0` and `t1` of its length, so a cut wire can show a gap. */
function wirePath(from: number, to: number, t0: number, t1: number): string {
  let curve: Point[] = [[62, from], [150, from], [150, to], [238, to]];
  // De Casteljau, twice: keep the piece before t1, then the piece after t0 within it.
  for (const [t, keepStart] of [[t1, true], [t0 / t1, false]] as const) {
    const [a, b, c, d] = curve as [Point, Point, Point, Point];
    const ab = lerp(a, b, t);
    const bc = lerp(b, c, t);
    const cd = lerp(c, d, t);
    const abc = lerp(ab, bc, t);
    const bcd = lerp(bc, cd, t);
    const mid = lerp(abc, bcd, t);
    curve = keepStart ? [a, ab, abc, mid] : [mid, bcd, cd, d];
  }
  const [a, b, c, d] = curve.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`);
  return `M${a}C${b} ${c} ${d}`;
}

export function Face({ state, solved, dispatch }: ModuleFaceProps<WirePanelsState, WirePanelsAction>) {
  const panel = state.panels[state.page] ?? [];
  const next = () => dispatch({ type: "next" });

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Wire Panels">
      <text x="20" y="38" fontSize="20" fontWeight="700" fill="#fff6e9" className="font-display">
        PANEL
      </text>
      <rect x="102" y="14" width="72" height="34" rx="8" fill="#0d0a14" stroke="#15101f" strokeWidth="3" />
      <text x="138" y="39" textAnchor="middle" fontSize="22" fontWeight="700" fill="#8dffc0" className="font-mono">
        {state.page + 1}/{state.panels.length}
      </text>
      <g aria-hidden>
        {state.panels.map((_, p) => (
          <circle
            key={p}
            cx={200 + p * 24}
            cy="31"
            r="9"
            fill={p < state.page ? "#5fd3a6" : p === state.page ? "#ffc94a" : "#3a2f5c"}
            stroke="#15101f"
            strokeWidth="3"
          />
        ))}
      </g>

      {/* A pale plate so black wires stand out as well as red and blue ones. */}
      <rect x="16" y="58" width="268" height="164" rx="14" fill="#15101f" />
      <rect x="20" y="62" width="260" height="156" rx="11" fill="#eadcc0" />

      {panel.map((wire, i) => {
        if (!wire) return null;
        const from = POST_Y[i] ?? 0;
        const to = POST_Y[wire.to] ?? 0;
        const { hex, name, letter, ink } = GAME_COLORS[wire.color];
        const off = wire.cut || solved;
        // The gap sits just past the color tag, before the wire reaches any other wire.
        const pieces = wire.cut ? [wirePath(from, to, 0, 0.22), wirePath(from, to, 0.32, 1)] : [wirePath(from, to, 0, 1)];
        const snip = () => dispatch({ type: "cut", index: i });
        return (
          <g
            key={i}
            role="button"
            tabIndex={off ? -1 : 0}
            aria-label={`Wire ${i + 1}, ${name}, to ${WIRE_PANELS_LETTERS[wire.to]}${wire.cut ? ", cut" : ""}`}
            aria-disabled={off}
            className={off ? "" : "cursor-pointer focus-visible:outline-2"}
            onClick={snip}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                snip();
              }
            }}
          >
            <rect x="20" y={from - 24} width="104" height="48" fill="transparent" />
            {pieces.map((d) => (
              <g key={d} fill="none" strokeLinecap={wire.cut ? "round" : "butt"}>
                <path d={d} stroke="#15101f" strokeWidth="14" />
                <path d={d} stroke={hex} strokeWidth="9" />
              </g>
            ))}
            <circle cx="88" cy={from} r="12" fill={hex} stroke={wire.color === "black" ? "#fff6e9" : "#15101f"} strokeWidth="2.5" />
            <text x="88" y={from + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={ink} className="font-display">
              {letter}
            </text>
          </g>
        );
      })}

      <g aria-hidden>
        {POST_Y.map((y, i) => (
          <g key={i} fontSize="19" fontWeight="700" fill="#fff6e9" textAnchor="middle" className="font-display">
            <circle cx="46" cy={y} r="17" fill="#3a2f5c" stroke="#15101f" strokeWidth="3" />
            <text x="46" y={y + 7}>
              {i + 1}
            </text>
            <circle cx="254" cy={y} r="17" fill="#3a2f5c" stroke="#15101f" strokeWidth="3" />
            <text x="254" y={y + 7}>
              {WIRE_PANELS_LETTERS[i]}
            </text>
          </g>
        ))}
      </g>

      <g
        role="button"
        tabIndex={solved ? -1 : 0}
        aria-label="Next panel"
        aria-disabled={solved}
        opacity={solved ? 0.45 : 1}
        className={solved ? "" : "cursor-pointer focus-visible:outline-2 active:translate-y-0.5"}
        onClick={next}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            next();
          }
        }}
      >
        <rect x="50" y="240" width="200" height="48" rx="14" fill="#15101f" />
        <rect x="50" y="234" width="200" height="48" rx="14" fill="#ffc94a" stroke="#15101f" strokeWidth="3" />
        <text x="134" y="265" textAnchor="middle" fontSize="20" fontWeight="700" fill="#221a38" className="font-display">
          NEXT PANEL
        </text>
        <path d="M216 247v22l18 -11z" fill="#221a38" />
      </g>
    </svg>
  );
}
