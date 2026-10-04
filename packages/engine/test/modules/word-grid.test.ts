import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  WORD_GRID_BUTTON_WORDS,
  WORD_GRID_DISPLAY_WORDS,
  WORD_GRID_PRIORITY_LENGTH,
  wordGrid,
  wordGridPositionToPress,
  type WordGridRules,
  type WordGridState,
} from "../../src/modules/word-grid";
import { ctxFor } from "../helpers";

const rules: WordGridRules = {
  read: [
    { display: "FLOUR", position: 0 },
    { display: "FLOWER", position: 3 },
    { display: "THYME", position: 5 },
  ],
  priority: [
    { word: "WAIT", order: ["STOP", "WAIT", "WHAT"] },
    { word: "WHAT", order: ["HMM", "OH", "WEIGHT", "WHAT"] },
    { word: "RIGHT", order: ["RIGHT", "WAIT"] },
    { word: "KNOT", order: ["HUH"] },
  ],
};

const buttons = ["WAIT", "WEIGHT", "RIGHT", "WHAT", "OWE", "KNOT"];

describe("word grid rules", () => {
  it.each<[string, string[], number]>([
    ["FLOUR", buttons, 0], // reads WAIT: STOP is absent, WAIT is first on the grid
    ["FLOWER", buttons, 1], // reads WHAT: HMM and OH absent, WEIGHT is on the grid
    ["FLOUR", ["WAIT", "OH", "STOP", "WHAT", "HMM", "NOW"], 2], // reads WAIT: STOP is on the grid
    ["FLOWER", ["WAIT", "OH", "STOP", "WHAT", "HMM", "NOW"], 4], // reads WHAT: HMM first
    ["FLOUR", ["RIGHT", "WAIT", "OH", "STOP", "HMM", "NOW"], 0], // reads RIGHT: itself first
    ["THYME", buttons, -1], // reads KNOT: nothing in its list is on the grid
    ["TIME", buttons, -1], // display word missing from the rules
    ["THYME", ["WAIT", "OH", "STOP", "WHAT", "HMM", "NOW"], -1], // read word has no list
  ])("display %s over %j presses position %i", (display, grid, expected) => {
    expect(wordGridPositionToPress(rules, { display, buttons: grid })).toBe(expected);
  });
});

describe("word grid module", () => {
  const state: WordGridState = {
    stages: [
      { display: "FLOUR", buttons },
      { display: "FLOWER", buttons },
      { display: "FLOUR", buttons: ["RIGHT", "WAIT", "OH", "STOP", "HMM", "NOW"] },
    ],
    stage: 0,
  };
  const ctx = ctxFor(rules);

  it("advances on a correct press and solves on the third", () => {
    const one = wordGrid.apply(state, { type: "press", position: 0 }, ctx);
    expect(one).toEqual({ state: { ...state, stage: 1 } });
    const two = wordGrid.apply(one.state, { type: "press", position: 1 }, ctx);
    expect(two).toEqual({ state: { ...state, stage: 2 } });
    const three = wordGrid.apply(two.state, { type: "press", position: 0 }, ctx);
    expect(three).toEqual({ state: { ...state, stage: 3 }, solved: true });
  });

  it("strikes on a wrong press and keeps the stage", () => {
    expect(wordGrid.apply(state, { type: "press", position: 4 }, ctx)).toEqual({ state, strike: true });
  });

  it("ignores presses once every stage is done", () => {
    const done = { ...state, stage: 3 };
    expect(wordGrid.apply(done, { type: "press", position: 0 }, ctx)).toEqual({ state: done });
    expect(wordGrid.hint(done, ctx)).toBeNull();
  });

  it("hints the position the rules resolve to", () => {
    expect(wordGrid.hint(state, ctx)).toEqual({ type: "press", position: 0 });
    expect(wordGrid.hint({ ...state, stage: 1 }, ctx)).toEqual({ type: "press", position: 1 });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(wordGrid.parseAction({ type: "press", position: 5, extra: 1 })).toEqual({
      type: "press",
      position: 5,
    });
    expect(wordGrid.parseAction({ type: "press", position: 6 })).toBeNull();
    expect(wordGrid.parseAction({ type: "press", position: 1.5 })).toBeNull();
    expect(wordGrid.parseAction({ type: "cut", position: 1 })).toBeNull();
    expect(wordGrid.parseAction(null)).toBeNull();
  });

  it("has 24 distinct words in each list", () => {
    expect(new Set(WORD_GRID_DISPLAY_WORDS).size).toBe(24);
    expect(new Set(WORD_GRID_BUTTON_WORDS).size).toBe(24);
  });

  it("generates the same rules for the same rule seed, covering every word", () => {
    const a = wordGrid.generateRules(createRng("rules:77").fork("word-grid"));
    const b = wordGrid.generateRules(createRng("rules:77").fork("word-grid"));
    expect(a).toEqual(b);
    expect(a.read.map((r) => r.display)).toEqual([...WORD_GRID_DISPLAY_WORDS]);
    expect(a.priority.map((p) => p.word)).toEqual([...WORD_GRID_BUTTON_WORDS]);
    for (const { word, order } of a.priority) {
      expect(order).toContain(word);
      expect(new Set(order).size).toBe(WORD_GRID_PRIORITY_LENGTH);
    }
    const other = wordGrid.generateRules(createRng("rules:78").fork("word-grid"));
    expect(other).not.toEqual(a);
  });

  it("generates three stages of six distinct buttons", () => {
    const generated = wordGrid.generate(createRng("bomb:1"), { edgework: ctx.edgework }, rules);
    expect(generated.stage).toBe(0);
    expect(generated.stages).toHaveLength(3);
    for (const stage of generated.stages) expect(new Set(stage.buttons).size).toBe(6);
  });

  it("plays 200 random instances to completion by following hints", () => {
    const generated = wordGrid.generateRules(createRng("rules:5").fork("word-grid"));
    expect(checkModuleSolvable(wordGrid, generated, { samples: 200, seed: "play" })).toEqual({ ok: true });
  });

  it("flags a rule set whose priority lists can miss the grid", () => {
    const generated = wordGrid.generateRules(createRng("rules:5").fork("word-grid"));
    const broken: WordGridRules = {
      ...generated,
      priority: generated.priority.map((p) => ({
        word: p.word,
        order: p.word === "WAIT" ? ["STOP"] : ["WAIT"],
      })),
    };
    expect(checkModuleSolvable(wordGrid, broken, { samples: 200 }).ok).toBe(false);
  });
});
