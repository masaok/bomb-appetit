"use client";

import type { KeyboardEvent } from "react";
import type { PasscodeAction, PasscodeState } from "@bombappetit/engine/modules/passcode";
import type { ModuleFaceProps } from "../types";

const WHEEL_W = 46;
const WHEEL_GAP = 8.5;

function onActivate(run: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };
}

export function Face({ state, solved, dispatch }: ModuleFaceProps<PasscodeState, PasscodeAction>) {
  const tabIndex = solved ? -1 : 0;
  const live = solved ? "" : "group cursor-pointer focus-visible:outline-2";

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Passcode">
      <rect x="12" y="52" width="276" height="100" rx="14" fill="#15101f" />
      {state.wheels.map((wheel, i) => {
        const x = 18 + i * (WHEEL_W + WHEEL_GAP);
        const cx = x + WHEEL_W / 2;
        const at = state.showing[i] ?? 0;
        const letter = wheel[at] ?? "";
        const above = wheel[(at - 1 + wheel.length) % wheel.length];
        const below = wheel[(at + 1) % wheel.length];
        const spin = (dir: 1 | -1) => dispatch({ type: "spin", wheel: i, dir });

        return (
          <g key={i}>
            <g
              role="button"
              tabIndex={tabIndex}
              aria-label={`Wheel ${i + 1} up`}
              aria-disabled={solved}
              className={live}
              onClick={() => spin(-1)}
              onKeyDown={onActivate(() => spin(-1))}
            >
              <rect x={x} y={14} width={WHEEL_W} height="30" rx="9" fill="#15101f" />
              <g className="motion-safe:transition-transform group-active:translate-y-[3px]">
                <rect
                  x={x}
                  y={10}
                  width={WHEEL_W}
                  height="30"
                  rx="9"
                  fill="#6ec1ff"
                  stroke="#15101f"
                  strokeWidth="3"
                />
                <path d={`M${cx - 9} 30L${cx} 19L${cx + 9} 30Z`} fill="#15101f" />
              </g>
            </g>

            {/* the window is its own tab stop so arrow keys can turn the wheel */}
            <g
              role="spinbutton"
              tabIndex={tabIndex}
              aria-label={`Wheel ${i + 1}`}
              aria-valuenow={at + 1}
              aria-valuemin={1}
              aria-valuemax={wheel.length}
              aria-valuetext={letter}
              aria-disabled={solved}
              className={solved ? "" : "focus-visible:outline-2"}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  spin(e.key === "ArrowUp" ? -1 : 1);
                }
              }}
            >
              <rect x={x} y={58} width={WHEEL_W} height="88" rx="8" fill="#fff6e9" />
              <rect x={x} y={58} width={WHEEL_W} height="20" rx="8" fill="#d9cdbb" />
              <rect x={x} y={126} width={WHEEL_W} height="20" rx="8" fill="#d9cdbb" />
              <text
                x={cx}
                y={74}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#7a6f8f"
                className="font-mono select-none"
                aria-hidden
              >
                {above}
              </text>
              <text
                x={cx}
                y={117}
                textAnchor="middle"
                fontSize="40"
                fontWeight="700"
                fill="#15101f"
                className="font-mono select-none"
              >
                {letter}
              </text>
              <text
                x={cx}
                y={141}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#7a6f8f"
                className="font-mono select-none"
                aria-hidden
              >
                {below}
              </text>
            </g>

            <g
              role="button"
              tabIndex={tabIndex}
              aria-label={`Wheel ${i + 1} down`}
              aria-disabled={solved}
              className={live}
              onClick={() => spin(1)}
              onKeyDown={onActivate(() => spin(1))}
            >
              <rect x={x} y={164} width={WHEEL_W} height="30" rx="9" fill="#15101f" />
              <g className="motion-safe:transition-transform group-active:translate-y-[3px]">
                <rect
                  x={x}
                  y={160}
                  width={WHEEL_W}
                  height="30"
                  rx="9"
                  fill="#6ec1ff"
                  stroke="#15101f"
                  strokeWidth="3"
                />
                <path d={`M${cx - 9} 170L${cx} 181L${cx + 9} 170Z`} fill="#15101f" />
              </g>
            </g>
          </g>
        );
      })}

      <g
        role="button"
        tabIndex={tabIndex}
        aria-label="Submit"
        aria-disabled={solved}
        className={solved ? "opacity-60" : live}
        onClick={() => dispatch({ type: "submit" })}
        onKeyDown={onActivate(() => dispatch({ type: "submit" }))}
      >
        <rect x="18" y="222" width="264" height="62" rx="16" fill="#15101f" />
        <g className="motion-safe:transition-transform group-active:translate-y-[5px]">
          <rect
            x="18"
            y="214"
            width="264"
            height="62"
            rx="16"
            fill="#ffc94a"
            stroke="#15101f"
            strokeWidth="3"
          />
          <text
            x="150"
            y="256"
            textAnchor="middle"
            fontSize="30"
            fontWeight="700"
            letterSpacing="3"
            fill="#15101f"
            className="font-display select-none"
          >
            SUBMIT
          </text>
        </g>
      </g>
    </svg>
  );
}
