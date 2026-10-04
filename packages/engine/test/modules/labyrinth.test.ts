import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  labyrinth,
  labyrinthDistances,
  labyrinthNextMove,
  labyrinthStep,
  type LabyrinthDirection,
  type LabyrinthMaze,
  type LabyrinthRules,
  type LabyrinthState,
} from "../../src/modules/labyrinth";
import { ctxFor, edgework } from "../helpers";

const cells = Array.from({ length: 36 }, (_, i) => i);

// Rows are open corridors joined at alternating ends: 0..5, down, 11..6, down, 12..17, and so on.
const rowSnake: LabyrinthMaze = {
  markers: [0, 35],
  wallRight: cells.map(() => false),
  wallBelow: cells.map((c) => ![5, 6, 17, 18, 29].includes(c)),
};

// The same shape turned on its side: columns are corridors.
const columnSnake: LabyrinthMaze = {
  markers: [7, 28],
  wallRight: cells.map((c) => ![30, 1, 32, 3, 34].includes(c)),
  wallBelow: cells.map(() => false),
};

const rules: LabyrinthRules = { mazes: [rowSnake, columnSnake] };
const ctx = ctxFor(rules, { edgework: edgework() });

describe("labyrinth maze helpers", () => {
  it.each<[LabyrinthMaze, number, LabyrinthDirection, number | null]>([
    [rowSnake, 0, "right", 1],
    [rowSnake, 0, "down", null], // wall
    [rowSnake, 0, "up", null], // top edge
    [rowSnake, 0, "left", null], // left edge
    [rowSnake, 5, "down", 11],
    [rowSnake, 5, "right", null], // right edge, even though no wall is recorded there
    [rowSnake, 11, "up", 5],
    [rowSnake, 35, "down", null], // bottom edge
    [columnSnake, 0, "down", 6],
    [columnSnake, 0, "right", null], // wall
    [columnSnake, 30, "right", 31],
    [columnSnake, 31, "left", 30],
  ])("maze %# from cell %i going %s lands on %s", (maze, cell, dir, expected) => {
    expect(labyrinthStep(maze, cell, dir)).toBe(expected);
  });

  it("measures distance along the corridors, not as the crow flies", () => {
    const distance = labyrinthDistances(rowSnake, 0);
    expect(distance[0]).toBe(0);
    expect(distance[5]).toBe(5);
    expect(distance[6]).toBe(11);
    expect(distance[35]).toBe(30);
  });

  it.each<[number, number, LabyrinthDirection | null]>([
    [0, 6, "right"], // cell 6 is directly below, but the only way is around
    [11, 6, "left"],
    [6, 0, "right"],
    [5, 6, "down"],
    [12, 0, "up"],
    [3, 3, null],
  ])("from %i to %i the next move is %s", (position, goal, expected) => {
    expect(labyrinthNextMove(rowSnake, position, goal)).toBe(expected);
  });
});

describe("labyrinth module", () => {
  const state: LabyrinthState = { markers: [0, 35], position: 4, goal: 11 };

  it("moves through an open passage", () => {
    expect(labyrinth.apply(state, { type: "move", dir: "right" }, ctx)).toEqual({
      state: { markers: [0, 35], position: 5, goal: 11 },
    });
  });

  it("solves on reaching the goal", () => {
    const beside = { ...state, position: 5 };
    expect(labyrinth.apply(beside, { type: "move", dir: "down" }, ctx)).toEqual({
      state: { markers: [0, 35], position: 11, goal: 11 },
      solved: true,
    });
  });

  it("strikes on a wall and on the edge, and stays put", () => {
    expect(labyrinth.apply(state, { type: "move", dir: "down" }, ctx)).toEqual({ state, strike: true });
    expect(labyrinth.apply(state, { type: "move", dir: "up" }, ctx)).toEqual({ state, strike: true });
  });

  it("judges by the maze the markers point to", () => {
    const other: LabyrinthState = { markers: [7, 28], position: 4, goal: 11 };
    expect(labyrinth.apply(other, { type: "move", dir: "right" }, ctx)).toEqual({ state: other, strike: true });
    expect(labyrinth.apply(other, { type: "move", dir: "down" }, ctx)).toEqual({
      state: { markers: [7, 28], position: 10, goal: 11 },
    });
  });

  it("ignores moves when the markers match no maze or the light is already on the goal", () => {
    const unknown: LabyrinthState = { markers: [1, 2], position: 4, goal: 11 };
    expect(labyrinth.apply(unknown, { type: "move", dir: "down" }, ctx)).toEqual({ state: unknown });
    expect(labyrinth.hint(unknown, ctx)).toBeNull();
    const done = { ...state, position: 11 };
    expect(labyrinth.apply(done, { type: "move", dir: "down" }, ctx)).toEqual({ state: done });
  });

  it("hints the first step of the shortest path", () => {
    expect(labyrinth.hint(state, ctx)).toEqual({ type: "move", dir: "right" });
    expect(labyrinth.hint({ ...state, position: 5 }, ctx)).toEqual({ type: "move", dir: "down" });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(labyrinth.parseAction({ type: "move", dir: "left" })).toEqual({ type: "move", dir: "left" });
    expect(labyrinth.parseAction({ type: "move", dir: "north" })).toBeNull();
    expect(labyrinth.parseAction({ type: "move", dir: 1 })).toBeNull();
    expect(labyrinth.parseAction({ type: "jump", dir: "left" })).toBeNull();
    expect(labyrinth.parseAction(null)).toBeNull();
  });
});

describe("labyrinth generated rules", () => {
  const generated = labyrinth.generateRules(createRng("rules:77").fork("labyrinth"));

  it("is deterministic per rule seed", () => {
    expect(labyrinth.generateRules(createRng("rules:77").fork("labyrinth"))).toEqual(generated);
    expect(labyrinth.generateRules(createRng("rules:78").fork("labyrinth"))).not.toEqual(generated);
  });

  it("has nine mazes and no marker cell shared between them", () => {
    expect(generated.mazes).toHaveLength(9);
    const markers = generated.mazes.flatMap((m) => m.markers);
    expect(new Set(markers).size).toBe(18);
    expect(markers.every((c) => Number.isInteger(c) && c >= 0 && c < 36)).toBe(true);
    for (const maze of generated.mazes) expect(maze.markers[0]).toBeLessThan(maze.markers[1]);
  });

  it("makes every maze perfect: all cells connected by exactly 35 passages", () => {
    for (const maze of generated.mazes) {
      const passages =
        cells.filter((c) => c % 6 < 5 && maze.wallRight[c] === false).length +
        cells.filter((c) => c < 30 && maze.wallBelow[c] === false).length;
      expect(passages).toBe(35);
      expect(labyrinthDistances(maze, 0).every((d) => d >= 0)).toBe(true);
    }
  });

  it("starts at least four steps from the goal", () => {
    for (let i = 0; i < 200; i++) {
      const state = labyrinth.generate(createRng(`bomb${i}`), { edgework: edgework() }, generated);
      const maze = generated.mazes.find((m) => m.markers[0] === state.markers[0] && m.markers[1] === state.markers[1]);
      expect(maze).toBeDefined();
      expect(labyrinthDistances(maze as LabyrinthMaze, state.goal)[state.position]).toBeGreaterThanOrEqual(4);
    }
  });

  it("is solvable by following hints", () => {
    expect(checkModuleSolvable(labyrinth, generated, { samples: 200, seed: "other" })).toEqual({ ok: true });
  });

  it("flags a maze whose goal is walled off", () => {
    const sealed: LabyrinthRules = {
      mazes: [{ markers: [0, 35], wallRight: cells.map(() => true), wallBelow: cells.map(() => true) }],
    };
    expect(checkModuleSolvable(labyrinth, sealed, { samples: 20 }).ok).toBe(false);
  });
});
