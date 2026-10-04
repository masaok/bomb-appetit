"use client";

import type { GlyphKeypadAction, GlyphKeypadState } from "@bombappetit/engine/modules/glyph-keypad";
import type { ModuleFaceProps } from "../types";
import { Glyph, glyphName } from "./glyphs";

const OUTLINE = "#15101f";

export function Face({ state, solved, dispatch }: ModuleFaceProps<GlyphKeypadState, GlyphKeypadAction>) {
  return (
    <div
      className="grid size-full grid-cols-2 grid-rows-2 gap-4 px-6 pt-5 pb-7 select-none"
      role="group"
      aria-label="Glyph Keypad"
    >
      {state.glyphs.map((glyph, position) => {
        const pressed = state.pressed[position] === true;
        return (
          <button
            key={position}
            type="button"
            aria-label={`Key ${position + 1}, ${glyphName(glyph)}${pressed ? ", pressed" : ""}`}
            aria-disabled={pressed || solved}
            onClick={() => dispatch({ type: "press", position })}
            className={`relative flex flex-col items-center justify-center rounded-2xl outline-offset-2 transition-transform duration-75 focus-visible:outline-4 focus-visible:outline-[#ffc94a] motion-reduce:transition-none ${
              pressed || solved ? "" : "cursor-pointer active:translate-y-1"
            }`}
            style={{
              color: OUTLINE,
              background: pressed ? "#d9cfbf" : "#fff6e9",
              border: `4px solid ${OUTLINE}`,
              boxShadow: pressed
                ? `0 2px 0 #8d8474, 0 2px 0 4px ${OUTLINE}`
                : `0 8px 0 #b9ad98, 0 8px 0 4px ${OUTLINE}`,
              transform: pressed ? "translateY(6px)" : undefined,
            }}
          >
            {/* lamp: a tick as well as a color, so it reads without color */}
            <span
              aria-hidden
              className="absolute top-2 flex h-4 w-12 items-center justify-center rounded-full"
              style={{ background: pressed ? "#35b37e" : "#3a2f5c", border: `2px solid ${OUTLINE}` }}
            >
              {pressed && (
                <svg
                  viewBox="0 0 12 8"
                  className="h-2.5 w-4"
                  fill="none"
                  stroke={OUTLINE}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1.5 4L4.5 7L10.5 1" />
                </svg>
              )}
            </span>
            <Glyph id={glyph} className="mt-4 size-[68px]" />
          </button>
        );
      })}
    </div>
  );
}
