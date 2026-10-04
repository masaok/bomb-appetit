"use client";

import type { ColorEchoAction, ColorEchoColor, ColorEchoState } from "@bombappetit/engine/modules/color-echo";
import { GAME_COLORS } from "../colors";
import type { ModuleFaceProps } from "../types";

const OUTLINE = "#15101f";
const FLASH_MS = 600;
const LIT_MS = 400;
const PAUSE_MS = 1400;

/** Each pad's big round corner points away from the middle, so the four read as one disc. */
const PADS: { color: ColorEchoColor; radius: string }[] = [
  { color: "red", radius: "72px 18px 18px 18px" },
  { color: "blue", radius: "18px 72px 18px 18px" },
  { color: "green", radius: "18px 18px 18px 72px" },
  { color: "yellow", radius: "18px 18px 72px 18px" },
];

/** The color lit at this instant: the stage's flashes one after another, a pause, then again. */
function litColor(state: ColorEchoState, elapsedMs: number): ColorEchoColor | null {
  const flashes = state.stage + 1;
  const t = Math.max(0, elapsedMs) % (flashes * FLASH_MS + PAUSE_MS);
  const index = Math.floor(t / FLASH_MS);
  if (index >= flashes || t % FLASH_MS >= LIT_MS) return null;
  return state.sequence[index] ?? null;
}

export function Face({ state, solved, bomb, dispatch }: ModuleFaceProps<ColorEchoState, ColorEchoAction>) {
  // No reduced-motion switch: the flashes are the puzzle, not decoration.
  const lit = solved ? null : litColor(state, bomb.elapsedMs);

  return (
    <div className="relative size-full select-none" role="group" aria-label="Color Echo">
      <div className="absolute inset-x-[26px] top-[14px] grid h-[248px] grid-cols-2 grid-rows-2 gap-3">
        {PADS.map(({ color, radius }) => {
          const { hex, name, letter, ink } = GAME_COLORS[color];
          const isLit = lit === color;
          return (
            <button
              key={color}
              type="button"
              aria-label={`${name} pad`}
              aria-disabled={solved}
              data-lit={isLit}
              onClick={() => dispatch({ type: "press", color })}
              className={`flex items-center justify-center font-display text-5xl font-bold outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#fff6e9] ${
                solved ? "" : "cursor-pointer active:scale-95"
              }`}
              style={{
                borderRadius: radius,
                color: isLit ? ink : "#fff6e9",
                background: isLit ? hex : `color-mix(in srgb, ${hex} 34%, ${OUTLINE})`,
                border: `4px solid ${isLit ? "#fff6e9" : OUTLINE}`,
                boxShadow: isLit ? `0 0 26px 4px ${hex}` : `inset 0 -8px 0 rgba(0, 0, 0, 0.28)`,
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div
        role="img"
        aria-label={`Stage ${Math.min(state.stage + 1, state.sequence.length)} of ${state.sequence.length}`}
        className="absolute inset-x-0 bottom-[10px] flex justify-center gap-2"
      >
        {state.sequence.map((_, i) => {
          const done = solved || i < state.stage;
          return (
            <span
              key={i}
              className="h-3 w-7 rounded-full"
              style={{
                background: done ? "#fff6e9" : i === state.stage ? "#3a2f5c" : "transparent",
                border: `2px solid ${done || i === state.stage ? "#fff6e9" : "#3a2f5c"}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
