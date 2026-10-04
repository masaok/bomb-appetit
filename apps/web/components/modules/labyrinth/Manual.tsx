import {
  LABYRINTH_SIZE,
  type LabyrinthMaze,
  type LabyrinthRules,
} from "@bombappetit/engine/modules/labyrinth";
import { ManualLead, ManualSubheading } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

const CELL = 20;
const PAD = 6;
const SPAN = CELL * LABYRINTH_SIZE;

function place(cell: number) {
  return `column ${(cell % LABYRINTH_SIZE) + 1}, row ${Math.floor(cell / LABYRINTH_SIZE) + 1}`;
}

function MazeDrawing({ maze, label }: { maze: LabyrinthMaze; label: string }) {
  const cells = Array.from({ length: LABYRINTH_SIZE * LABYRINTH_SIZE }, (_, i) => i);
  const walls: string[] = [];
  for (const cell of cells) {
    const x = PAD + (cell % LABYRINTH_SIZE) * CELL;
    const y = PAD + Math.floor(cell / LABYRINTH_SIZE) * CELL;
    if (cell % LABYRINTH_SIZE < LABYRINTH_SIZE - 1 && maze.wallRight[cell])
      walls.push(`M${x + CELL} ${y}v${CELL}`);
    if (cell < cells.length - LABYRINTH_SIZE && maze.wallBelow[cell]) walls.push(`M${x} ${y + CELL}h${CELL}`);
  }

  return (
    <svg
      viewBox={`0 0 ${SPAN + PAD * 2} ${SPAN + PAD * 2}`}
      className="w-full max-w-44"
      role="img"
      aria-label={`${label}, with walls drawn as lines`}
    >
      {cells.map((cell) => (
        <circle
          key={cell}
          cx={PAD + (cell % LABYRINTH_SIZE) * CELL + CELL / 2}
          cy={PAD + Math.floor(cell / LABYRINTH_SIZE) * CELL + CELL / 2}
          r="1.5"
          fill="currentColor"
          opacity="0.45"
        />
      ))}
      {maze.markers.map((cell) => (
        <circle
          key={cell}
          cx={PAD + (cell % LABYRINTH_SIZE) * CELL + CELL / 2}
          cy={PAD + Math.floor(cell / LABYRINTH_SIZE) * CELL + CELL / 2}
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      ))}
      <rect x={PAD} y={PAD} width={SPAN} height={SPAN} fill="none" stroke="currentColor" strokeWidth="3" />
      <path d={walls.join("")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Manual({ rules }: ModuleManualProps<LabyrinthRules>) {
  return (
    <>
      <ManualLead>
        A six by six grid of dots with four arrow buttons. Two dots have a ring around them. The white light
        is the Defuser. The red triangle is the goal. The Defuser cannot see any walls.
      </ManualLead>
      <ManualLead>
        Ask where the two rings are. Columns count from the left. Rows count from the top. Find the maze with
        rings in the same two places. Then ask where the light and the triangle are. Guide the light to the
        triangle one step at a time. Lines are walls. Stepping into a wall is a strike. Stepping off the grid
        is a strike. The light stays where it was.
      </ManualLead>
      <ManualSubheading>Mazes</ManualSubheading>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        {rules.mazes.map((maze, i) => (
          <figure key={i} className="break-inside-avoid">
            <MazeDrawing maze={maze} label={`Maze ${i + 1}`} />
            <figcaption className="mt-1 text-sm leading-snug">
              <span className="font-display font-semibold">Maze {i + 1}.</span> Rings at{" "}
              {place(maze.markers[0])} and {place(maze.markers[1])}.
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
