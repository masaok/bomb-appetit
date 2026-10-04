"use client";

import type { TangledWiresAction, TangledWiresState, TangledWiresWire } from "@bombappetit/engine/modules/tangled-wires";
import { GAME_COLORS } from "../colors";
import type { ModuleFaceProps } from "../types";

const STAR = "M0 -11L3.2 -3.6L11 -3.2L4.9 1.8L7 9.6L0 5.2L-7 9.6L-4.9 1.8L-11 -3.2L-3.2 -3.6Z";

function wireColor(wire: TangledWiresWire): { name: string; letters: string; base: string; stripe: string | null; ink: string } {
  const { red, blue, white } = GAME_COLORS;
  if (wire.red && wire.blue) {
    return { name: "red and blue striped", letters: red.letter + blue.letter, base: red.hex, stripe: blue.hex, ink: red.ink };
  }
  if (wire.red) return { name: "red", letters: red.letter, base: red.hex, stripe: null, ink: red.ink };
  if (wire.blue) return { name: "blue", letters: blue.letter, base: blue.hex, stripe: null, ink: blue.ink };
  return { name: "white", letters: white.letter, base: white.hex, stripe: null, ink: white.ink };
}

export function Face({ state, solved, dispatch }: ModuleFaceProps<TangledWiresState, TangledWiresAction>) {
  const count = state.wires.length;
  const step = 46 + (6 - count) * 8;
  const slotX = (slot: number) => 150 + (slot - (count - 1) / 2) * step;

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Tangled Wires">
      <rect x="12" y="12" width="276" height="42" rx="10" fill="#3a2f5c" />
      <rect x="12" y="242" width="276" height="46" rx="10" fill="#3a2f5c" />
      {state.wires.map((wire, i) => {
        const top = slotX(i);
        const bottom = slotX(wire.to);
        const cut = state.cut[i] === true;
        const off = cut || solved;
        const color = wireColor(wire);
        const snip = () => dispatch({ type: "cut", index: i });
        const stub = `M${top} 54V86`;
        const rest = `M${top} ${cut ? 102 : 86}V108C${top} 164 ${bottom} 158 ${bottom} 214V244`;
        const label = [
          `Wire ${i + 1}`,
          color.name,
          wire.led ? "light on" : "light off",
          wire.star ? "star" : "no star",
          ...(cut ? ["cut"] : []),
        ].join(", ");
        return (
          <g
            key={i}
            role="button"
            tabIndex={off ? -1 : 0}
            aria-label={label}
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
            {/* Hit areas cover only the straight ends, where no other wire passes. */}
            <rect x={top - step / 2} y="12" width={step} height="96" fill="transparent" />
            <rect x={bottom - step / 2} y="214" width={step} height="74" fill="transparent" />

            {[stub, rest].map((d) => (
              <g key={d} fill="none" strokeLinecap={cut ? "round" : "butt"}>
                <path d={d} stroke="#15101f" strokeWidth="13" />
                <path d={d} stroke={color.base} strokeWidth="8" />
                {color.stripe && <path d={d} stroke={color.stripe} strokeWidth="8" strokeDasharray="9 9" strokeLinecap="butt" />}
              </g>
            ))}

            <rect x={top - 14} y="61" width="28" height="18" rx="6" fill={color.base} stroke="#15101f" strokeWidth="2.5" />
            {color.stripe && <path d={`M${top} 62.5h7.5a5 5 0 0 1 5 5v5a5 5 0 0 1 -5 5h-7.5z`} fill={color.stripe} />}
            <text x={top} y="74.5" textAnchor="middle" fontSize="12" fontWeight="800" fill={color.ink} className="font-display">
              {color.letters}
            </text>

            {wire.led && <circle cx={top} cy="33" r="16" fill="#ffc94a" opacity="0.35" />}
            <circle cx={top} cy="33" r="10.5" fill={wire.led ? "#fff6e9" : "#1b1430"} stroke={wire.led ? "#ffc94a" : "#15101f"} strokeWidth="3" />

            {wire.star ? (
              <path d={STAR} transform={`translate(${bottom} 266) scale(1.35)`} fill="#ffc94a" stroke="#15101f" strokeWidth="1.8" strokeLinejoin="round" />
            ) : (
              <circle cx={bottom} cy="266" r="4" fill="#15101f" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
