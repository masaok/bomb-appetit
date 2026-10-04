import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isRecord, type ModuleDef } from "../../types";

export const LABYRINTH_SIZE = 6;
export const LABYRINTH_MAZE_COUNT = 9;
export const LABYRINTH_MIN_STEPS = 4;

export const LABYRINTH_DIRECTIONS = ["up", "right", "down", "left"] as const;
export type LabyrinthDirection = (typeof LABYRINTH_DIRECTIONS)[number];

const CELL_COUNT = LABYRINTH_SIZE * LABYRINTH_SIZE;

/** Cells are numbered row by row from the top left: `row * 6 + column`. */
export interface LabyrinthMaze {
  /** Two cells, lowest first. No other maze uses either cell. */
  markers: [number, number];
  /** One entry per cell: true when a wall blocks the way to the cell on its right. */
  wallRight: boolean[];
  /** One entry per cell: true when a wall blocks the way to the cell below. */
  wallBelow: boolean[];
}

export interface LabyrinthRules {
  mazes: LabyrinthMaze[];
}

export interface LabyrinthState {
  /** Identifies the maze. The Defuser sees these two cells and nothing of the walls. */
  markers: [number, number];
  position: number;
  goal: number;
}

export type LabyrinthAction = { type: "move"; dir: LabyrinthDirection };

export function labyrinthMazeFor(rules: LabyrinthRules, markers: readonly number[]): LabyrinthMaze | null {
  return rules.mazes.find((m) => m.markers[0] === markers[0] && m.markers[1] === markers[1]) ?? null;
}

/** The cell one step from `cell` in `dir`, or null when a wall or the edge of the grid is in the way. */
export function labyrinthStep(maze: LabyrinthMaze, cell: number, dir: LabyrinthDirection): number | null {
  const row = Math.floor(cell / LABYRINTH_SIZE);
  const col = cell % LABYRINTH_SIZE;
  switch (dir) {
    case "up":
      return row > 0 && maze.wallBelow[cell - LABYRINTH_SIZE] === false ? cell - LABYRINTH_SIZE : null;
    case "down":
      return row < LABYRINTH_SIZE - 1 && maze.wallBelow[cell] === false ? cell + LABYRINTH_SIZE : null;
    case "left":
      return col > 0 && maze.wallRight[cell - 1] === false ? cell - 1 : null;
    case "right":
      return col < LABYRINTH_SIZE - 1 && maze.wallRight[cell] === false ? cell + 1 : null;
  }
}

/** Steps from every cell to `from` by breadth-first search; -1 for a cell that cannot reach it. */
export function labyrinthDistances(maze: LabyrinthMaze, from: number): number[] {
  const distance = Array.from({ length: CELL_COUNT }, () => -1);
  if (from < 0 || from >= CELL_COUNT) return distance;
  distance[from] = 0;
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head] as number;
    for (const dir of LABYRINTH_DIRECTIONS) {
      const next = labyrinthStep(maze, cell, dir);
      if (next !== null && distance[next] === -1) {
        distance[next] = (distance[cell] as number) + 1;
        queue.push(next);
      }
    }
  }
  return distance;
}

/** The first move of a shortest path, or null when already there or there is no path. */
export function labyrinthNextMove(
  maze: LabyrinthMaze,
  position: number,
  goal: number,
): LabyrinthDirection | null {
  const distance = labyrinthDistances(maze, goal);
  const here = distance[position];
  if (here === undefined || here <= 0) return null;
  for (const dir of LABYRINTH_DIRECTIONS) {
    const next = labyrinthStep(maze, position, dir);
    if (next !== null && distance[next] === here - 1) return dir;
  }
  return null;
}

/** Randomized Kruskal: knock out walls in shuffled order unless that would close a loop. */
function carve(rng: Rng): Pick<LabyrinthMaze, "wallRight" | "wallBelow"> {
  const wallRight = Array.from({ length: CELL_COUNT }, () => true);
  const wallBelow = Array.from({ length: CELL_COUNT }, () => true);
  const group = Array.from({ length: CELL_COUNT }, (_, i) => i);
  const find = (cell: number): number => {
    let root = cell;
    while (group[root] !== root) root = group[root] as number;
    return root;
  };

  const edges: { cell: number; side: "right" | "below" }[] = [];
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (cell % LABYRINTH_SIZE < LABYRINTH_SIZE - 1) edges.push({ cell, side: "right" });
    if (cell + LABYRINTH_SIZE < CELL_COUNT) edges.push({ cell, side: "below" });
  }
  for (const { cell, side } of rng.shuffle(edges)) {
    const a = find(cell);
    const b = find(side === "right" ? cell + 1 : cell + LABYRINTH_SIZE);
    if (a === b) continue;
    group[a] = b;
    (side === "right" ? wallRight : wallBelow)[cell] = false;
  }
  return { wallRight, wallBelow };
}

function propose(rng: Rng): LabyrinthRules {
  const cells = rng.fork("markers").sample(
    Array.from({ length: CELL_COUNT }, (_, i) => i),
    LABYRINTH_MAZE_COUNT * 2,
  );
  return {
    mazes: Array.from({ length: LABYRINTH_MAZE_COUNT }, (_, i) => {
      const a = cells[i * 2] as number;
      const b = cells[i * 2 + 1] as number;
      return { markers: [Math.min(a, b), Math.max(a, b)], ...carve(rng.fork(`maze${i}`)) };
    }),
  };
}

export const labyrinth: ModuleDef<"labyrinth", LabyrinthState, LabyrinthAction, LabyrinthRules> = {
  id: "labyrinth",
  name: "Labyrinth",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(ruleRng, propose, (rules) => checkModuleSolvable(labyrinth, rules).ok);
  },

  generate(rng, _bomb, rules) {
    const maze = rng.pick(rules.mazes);
    const position = rng.int(0, CELL_COUNT - 1);
    const far = labyrinthDistances(maze, position)
      .map((steps, cell) => ({ steps, cell }))
      .filter(({ steps }) => steps >= LABYRINTH_MIN_STEPS);
    // A hand-written maze could be too cramped; a goal on the start cell would be unsolvable, so fail the check instead.
    const goal = far.length > 0 ? rng.pick(far).cell : -1;
    return { markers: [maze.markers[0], maze.markers[1]], position, goal };
  },

  apply(state, action, ctx) {
    const maze = labyrinthMazeFor(ctx.rules, state.markers);
    if (!maze || state.position === state.goal) return { state };
    const next = labyrinthStep(maze, state.position, action.dir);
    if (next === null) return { state, strike: true };
    const moved = { ...state, position: next };
    return next === state.goal ? { state: moved, solved: true } : { state: moved };
  },

  hint(state, ctx) {
    const maze = labyrinthMazeFor(ctx.rules, state.markers);
    if (!maze) return null;
    const dir = labyrinthNextMove(maze, state.position, state.goal);
    return dir === null ? null : { type: "move", dir };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "move") return null;
    const dir = LABYRINTH_DIRECTIONS.find((d) => d === raw.dir);
    return dir ? { type: "move", dir } : null;
  },
};
