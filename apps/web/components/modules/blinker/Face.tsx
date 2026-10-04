"use client";

import type { ReactNode } from "react";
import {
  blinkerLightOn,
  BLINKER_FREQUENCIES,
  type BlinkerAction,
  type BlinkerState,
} from "@bombappetit/engine/modules/blinker";
import type { ModuleFaceProps } from "../types";

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

function PanelButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <g
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      opacity={disabled ? 0.45 : 1}
      className={disabled ? "" : "cursor-pointer focus-visible:outline-2 active:translate-y-0.5"}
      onClick={() => {
        if (!disabled) onPress();
      }}
      onKeyDown={(e) => {
        if (disabled || (e.key !== " " && e.key !== "Enter")) return;
        e.preventDefault();
        onPress();
      }}
    >
      {children}
    </g>
  );
}

export function Face({ state, solved, bomb, dispatch }: ModuleFaceProps<BlinkerState, BlinkerAction>) {
  const lit = !solved && blinkerLightOn(state, bomb.elapsedMs);
  const last = BLINKER_FREQUENCIES.length - 1;
  const tickX = (i: number) => 54 + (i * 192) / last;

  return (
    <svg viewBox="0 0 300 300" className="size-full" role="group" aria-label="Blinker">
      <g role="img" aria-label={`Signal light, ${lit ? "on" : "off"}`}>
        {lit &&
          RAYS.map((angle) => (
            <line
              key={angle}
              x1="150"
              y1="14"
              x2="150"
              y2="4"
              stroke="#ffc94a"
              strokeWidth="5"
              strokeLinecap="round"
              transform={`rotate(${angle} 150 66)`}
            />
          ))}
        <circle cx="150" cy="66" r="46" fill="#15101f" />
        <circle cx="150" cy="66" r="39" fill={lit ? "#ffc94a" : "#3d3020"} stroke="#fff6e9" strokeWidth="3" />
        <circle cx="150" cy="66" r="27" fill={lit ? "#fff3c4" : "#4a3b28"} />
        <path
          d="M128 52a26 26 0 0 1 18 -12"
          stroke={lit ? "#ffffff" : "#6b5a44"}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      <rect x="34" y="132" width="232" height="54" rx="12" fill="#0d0a14" stroke="#15101f" strokeWidth="4" />
      <text
        x="196"
        y="171"
        textAnchor="end"
        fontSize="38"
        fontWeight="700"
        fill="#8dffc0"
        className="font-mono"
      >
        {BLINKER_FREQUENCIES[state.tuned] ?? "-.---"}
      </text>
      <text x="204" y="171" fontSize="16" fontWeight="700" fill="#8dffc0" className="font-mono">
        MHz
      </text>

      <g aria-hidden>
        <line x1="54" y1="204" x2="246" y2="204" stroke="#6f5fa8" strokeWidth="3" strokeLinecap="round" />
        {BLINKER_FREQUENCIES.map((_, i) => (
          <line
            key={i}
            x1={tickX(i)}
            y1="198"
            x2={tickX(i)}
            y2="210"
            stroke="#6f5fa8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        <path
          d={`M${tickX(state.tuned) - 7} 192h14l-7 12z`}
          fill="#f04a3a"
          stroke="#15101f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>

      <PanelButton
        label="Tune down"
        disabled={solved || state.tuned <= 0}
        onPress={() => dispatch({ type: "tune", dir: -1 })}
      >
        <rect x="18" y="230" width="52" height="54" rx="14" fill="#15101f" />
        <rect x="18" y="224" width="52" height="54" rx="14" fill="#6ec1ff" stroke="#15101f" strokeWidth="3" />
        <path
          d="M54 237v28l-22 -14z"
          fill="#15101f"
          stroke="#15101f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </PanelButton>

      <PanelButton label="Transmit" disabled={solved} onPress={() => dispatch({ type: "transmit" })}>
        <rect x="82" y="230" width="136" height="54" rx="14" fill="#15101f" />
        <rect
          x="82"
          y="224"
          width="136"
          height="54"
          rx="14"
          fill="#f04a3a"
          stroke="#15101f"
          strokeWidth="3"
        />
        <text
          x="150"
          y="259"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#fff6e9"
          className="font-display"
        >
          TRANSMIT
        </text>
      </PanelButton>

      <PanelButton
        label="Tune up"
        disabled={solved || state.tuned >= last}
        onPress={() => dispatch({ type: "tune", dir: 1 })}
      >
        <rect x="230" y="230" width="52" height="54" rx="14" fill="#15101f" />
        <rect
          x="230"
          y="224"
          width="52"
          height="54"
          rx="14"
          fill="#6ec1ff"
          stroke="#15101f"
          strokeWidth="3"
        />
        <path
          d="M246 237v28l22 -14z"
          fill="#15101f"
          stroke="#15101f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </PanelButton>
    </svg>
  );
}
