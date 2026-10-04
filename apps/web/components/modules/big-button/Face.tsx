"use client";

import type { BigButtonAction, BigButtonState } from "@bombappetit/engine/modules/big-button";
import { HoldButton } from "@/components/bomb/HoldButton";
import { GAME_COLORS } from "../colors";
import type { ModuleFaceProps } from "../types";

const OUTLINE = "#15101f";

export function Face({ state, solved, dispatch }: ModuleFaceProps<BigButtonState, BigButtonAction>) {
  const button = GAME_COLORS[state.color];
  const strip = GAME_COLORS[state.strip];
  const held = state.press.kind === "held";
  const side = `color-mix(in srgb, ${button.hex} 55%, ${OUTLINE})`;

  return (
    <div className="relative size-full select-none" role="group" aria-label="Big Button">
      {/* collar the button sinks into */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: 14,
          top: 44,
          width: 212,
          height: 220,
          background: "#3a2f5c",
          border: `4px solid ${OUTLINE}`,
        }}
      />
      <HoldButton
        aria-label={`Big button, ${button.name}, ${state.label}`}
        disabled={solved}
        onPress={() => dispatch({ type: "press" })}
        onRelease={() => dispatch({ type: "release" })}
        className="absolute flex cursor-pointer flex-col items-center justify-center rounded-full font-display outline-offset-4 transition-transform duration-75 focus-visible:outline-4 focus-visible:outline-[#fff6e9] disabled:cursor-default motion-reduce:transition-none"
        style={{
          left: 26,
          top: 52,
          width: 188,
          height: 188,
          color: button.ink,
          background: `radial-gradient(circle at 35% 28%, color-mix(in srgb, ${button.hex} 70%, #ffffff), ${button.hex} 55%)`,
          border: `5px solid ${OUTLINE}`,
          boxShadow: held
            ? `0 3px 0 ${side}, 0 3px 0 5px ${OUTLINE}`
            : `0 14px 0 ${side}, 0 14px 0 5px ${OUTLINE}`,
          transform: held ? "translateY(11px)" : "none",
        }}
      >
        <span className="text-[38px] leading-none font-bold tracking-wide">{state.label}</span>
        <span
          aria-hidden
          className="mt-3 flex size-8 items-center justify-center rounded-full text-base font-bold"
          style={{ border: `3px solid ${button.ink}` }}
        >
          {button.letter}
        </span>
      </HoldButton>

      <div
        role="img"
        aria-label={held ? `Strip, ${strip.name}` : "Strip, off"}
        className="absolute flex items-center justify-center rounded-xl font-display text-2xl font-bold"
        style={{
          left: 244,
          top: 44,
          width: 40,
          height: 220,
          color: strip.ink,
          background: held ? strip.hex : "#221a38",
          border: `4px solid ${OUTLINE}`,
          boxShadow: held ? `0 0 22px ${strip.hex}` : "inset 0 0 0 3px #3a2f5c",
        }}
      >
        {held ? strip.letter : null}
      </div>
    </div>
  );
}
