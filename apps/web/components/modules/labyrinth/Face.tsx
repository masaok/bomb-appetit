"use client";

import {
  LABYRINTH_SIZE,
  type LabyrinthAction,
  type LabyrinthDirection,
  type LabyrinthState,
} from "@bombappetit/engine/modules/labyrinth";
import type { ModuleFaceProps } from "../types";

const STEP = 32;
const FIRST = 70;

const ARROWS: { dir: LabyrinthDirection; x: number; y: number; w: number; h: number; tip: string }[] = [
  { dir: "up", x: 108, y: 6, w: 84, h: 34, tip: "150,13 164,33 136,33" },
  { dir: "down", x: 108, y: 260, w: 84, h: 34, tip: "150,287 164,267 136,267" },
  { dir: "left", x: 6, y: 108, w: 34, h: 84, tip: "13,150 33,136 33,164" },
  { dir: "right", x: 260, y: 108, w: 34, h: 84, tip: "287,150 267,136 267,164" },
];

const ARROW_KEYS: Record<string, LabyrinthDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function center(cell: number) {
  return {
    x: FIRST + (cell % LABYRINTH_SIZE) * STEP,
    y: FIRST + Math.floor(cell / LABYRINTH_SIZE) * STEP,
  };
}

function place(cell: number) {
  return `column ${(cell % LABYRINTH_SIZE) + 1}, row ${Math.floor(cell / LABYRINTH_SIZE) + 1}`;
}

export function Face({ state, solved, dispatch }: ModuleFaceProps<LabyrinthState, LabyrinthAction>) {
  const here = center(state.position);
  const goal = center(state.goal);
  const cells = Array.from({ length: LABYRINTH_SIZE * LABYRINTH_SIZE }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 300 300"
      className="size-full focus-visible:outline-2"
      role="group"
      aria-label="Labyrinth"
      tabIndex={solved ? -1 : 0}
      onKeyDown={(e) => {
        const dir = ARROW_KEYS[e.key];
        if (dir) {
          e.preventDefault();
          dispatch({ type: "move", dir });
        }
      }}
    >
      <rect x="48" y="48" width="204" height="204" rx="14" fill="#15101f" stroke="#3a2f5c" strokeWidth="4" />

      {cells.map((cell) => {
        const { x, y } = center(cell);
        return <circle key={cell} cx={x} cy={y} r="4" fill="#5b4b9a" />;
      })}

      {state.markers.map((cell) => {
        const { x, y } = center(cell);
        return (
          <circle
            key={cell}
            role="img"
            aria-label={`Ring at ${place(cell)}`}
            cx={x}
            cy={y}
            r="12"
            fill="none"
            stroke="#5fd3a6"
            strokeWidth="3.5"
          />
        );
      })}

      {state.goal !== state.position && (
        <polygon
          role="img"
          aria-label={`Goal at ${place(state.goal)}`}
          points={`${goal.x},${goal.y - 9} ${goal.x + 9},${goal.y + 7} ${goal.x - 9},${goal.y + 7}`}
          fill="#f04a3a"
          stroke="#fff6e9"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}

      <g role="img" aria-label={`Your light at ${place(state.position)}`}>
        <circle
          cx={here.x}
          cy={here.y}
          r="10"
          fill="#fff6e9"
          opacity="0.25"
          className="motion-safe:animate-pulse"
        />
        <circle cx={here.x} cy={here.y} r="6.5" fill="#fff6e9" stroke="#15101f" strokeWidth="1.5" />
      </g>

      {ARROWS.map(({ dir, x, y, w, h, tip }) => (
        <g
          key={dir}
          role="button"
          tabIndex={solved ? -1 : 0}
          aria-label={`Move ${dir}`}
          aria-disabled={solved}
          className={solved ? "opacity-50" : "cursor-pointer focus-visible:outline-2 active:translate-y-0.5"}
          onClick={() => dispatch({ type: "move", dir })}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              dispatch({ type: "move", dir });
            }
          }}
        >
          <rect x={x} y={y + 3} width={w} height={h} rx="10" fill="#15101f" />
          <rect x={x} y={y} width={w} height={h} rx="10" fill="#ffc94a" stroke="#15101f" strokeWidth="3" />
          <polygon points={tip} fill="#15101f" stroke="#15101f" strokeWidth="3" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
}
