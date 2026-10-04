import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  colorEcho,
  colorEchoMapping,
  COLOR_ECHO_COLORS,
  type ColorEchoColor,
  type ColorEchoRules,
  type ColorEchoState,
} from "../../src/modules/color-echo";
import { ctxFor, edgework } from "../helpers";

const rules: ColorEchoRules = {
  vowel: [
    { red: "blue", blue: "green", green: "yellow", yellow: "red" },
    { red: "green", blue: "red", green: "blue", yellow: "yellow" },
    { red: "yellow", blue: "blue", green: "red", yellow: "green" },
  ],
  noVowel: [
    { red: "red", blue: "yellow", green: "blue", yellow: "green" },
    { red: "blue", blue: "red", green: "yellow", yellow: "green" },
    { red: "green", blue: "yellow", green: "red", yellow: "blue" },
  ],
};

const vowelBomb = edgework({ serial: "AB1CD2" });
const plainBomb = edgework({ serial: "XB1CD2" });

describe("color echo rules", () => {
  it.each<[boolean, number, ColorEchoColor, ColorEchoColor]>([
    [true, 0, "red", "blue"],
    [true, 1, "red", "green"],
    [true, 2, "red", "yellow"],
    [true, 5, "green", "red"], // more than two strikes uses the last table
    [false, 0, "blue", "yellow"],
    [false, 1, "blue", "red"],
    [false, 2, "yellow", "blue"],
  ])("vowel %s with %i strikes: a %s flash means press %s", (hasVowel, strikes, flashed, expected) => {
    expect(colorEchoMapping(rules, hasVowel, strikes)[flashed]).toBe(expected);
  });
});

describe("color echo module", () => {
  const start: ColorEchoState = { sequence: ["red", "green", "red"], stage: 0, entered: 0 };
  const ctx = ctxFor(rules, { edgework: vowelBomb });

  it("advances to the next stage when the stage is complete", () => {
    expect(colorEcho.apply(start, { type: "press", color: "blue" }, ctx)).toEqual({
      state: { sequence: ["red", "green", "red"], stage: 1, entered: 0 },
    });
  });

  it("counts a correct press inside a stage", () => {
    const stageTwo = { ...start, stage: 1 };
    expect(colorEcho.apply(stageTwo, { type: "press", color: "blue" }, ctx)).toEqual({
      state: { sequence: ["red", "green", "red"], stage: 1, entered: 1 },
    });
  });

  it("strikes on a wrong press and restarts the stage's input, keeping the stage", () => {
    const partway = { ...start, stage: 2, entered: 1 };
    expect(colorEcho.apply(partway, { type: "press", color: "green" }, ctx)).toEqual({
      state: { sequence: ["red", "green", "red"], stage: 2, entered: 0 },
      strike: true,
    });
  });

  it("solves when the last stage is complete", () => {
    const last = { ...start, stage: 2, entered: 2 };
    const solved: ColorEchoState = { sequence: ["red", "green", "red"], stage: 2, entered: 3 };
    expect(colorEcho.apply(last, { type: "press", color: "blue" }, ctx)).toEqual({
      state: solved,
      solved: true,
    });
    expect(colorEcho.apply(solved, { type: "press", color: "blue" }, ctx)).toEqual({ state: solved });
    expect(colorEcho.hint(solved, ctx)).toBeNull();
  });

  it("reads the serial number and the strike count at each press", () => {
    const plain = ctxFor(rules, { edgework: plainBomb });
    expect(colorEcho.hint(start, plain)).toEqual({ type: "press", color: "red" });
    expect(colorEcho.apply(start, { type: "press", color: "blue" }, plain).strike).toBe(true);

    const struck = ctxFor(rules, { edgework: vowelBomb, strikes: 1 });
    expect(colorEcho.hint(start, struck)).toEqual({ type: "press", color: "green" });
    expect(colorEcho.hint({ ...start, stage: 1, entered: 1 }, struck)).toEqual({
      type: "press",
      color: "blue",
    });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(colorEcho.parseAction({ type: "press", color: "green" })).toEqual({
      type: "press",
      color: "green",
    });
    expect(colorEcho.parseAction({ type: "press", color: "white" })).toBeNull();
    expect(colorEcho.parseAction({ type: "press", color: 2 })).toBeNull();
    expect(colorEcho.parseAction({ type: "tap", color: "red" })).toBeNull();
    expect(colorEcho.parseAction("red")).toBeNull();
  });

  it("generates the same rules for the same rule seed: six distinct permutations", () => {
    const a = colorEcho.generateRules(createRng("rules:77").fork("color-echo"));
    const b = colorEcho.generateRules(createRng("rules:77").fork("color-echo"));
    expect(a).toEqual(b);
    const tables = [...a.vowel, ...a.noVowel];
    expect(tables).toHaveLength(6);
    for (const table of tables) {
      expect(COLOR_ECHO_COLORS.map((c) => table[c]).sort()).toEqual([...COLOR_ECHO_COLORS].sort());
    }
    expect(new Set(tables.map((t) => JSON.stringify(t))).size).toBe(6);
  });

  it("generates a sequence of three to five colors", () => {
    for (let i = 0; i < 50; i++) {
      const made = colorEcho.generate(createRng(`bomb:${i}`), { edgework: vowelBomb }, rules);
      expect(made.sequence.length).toBeGreaterThanOrEqual(3);
      expect(made.sequence.length).toBeLessThanOrEqual(5);
      expect(made.sequence.every((c) => COLOR_ECHO_COLORS.includes(c))).toBe(true);
      expect(made).toMatchObject({ stage: 0, entered: 0 });
    }
  });

  it("plays 200 random instances to completion by following hint", () => {
    for (const seed of ["rules:1", "rules:2", "rules:3"]) {
      const generated = colorEcho.generateRules(createRng(seed).fork("color-echo"));
      expect(checkModuleSolvable(colorEcho, generated, { samples: 200, seed: "other" })).toEqual({
        ok: true,
      });
    }
  });
});
