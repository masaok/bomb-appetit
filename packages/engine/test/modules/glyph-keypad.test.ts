import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  glyphKeypad,
  glyphKeypadColumnsAreDistinct,
  glyphKeypadOrder,
  GLYPH_KEYPAD_GLYPHS,
  type GlyphKeypadGlyph,
  type GlyphKeypadRules,
  type GlyphKeypadState,
} from "../../src/modules/glyph-keypad";
import { ctxFor } from "../helpers";

const rules: GlyphKeypadRules = {
  columns: [
    ["circle-dot", "square-bar", "arch-plus", "diamond-ring", "hexagon-zigzag", "triangle-dot", "circle-bar"],
    ["triangle-dot", "circle-dot", "square-plus", "arch-plus", "diamond-bar", "hexagon-ring", "square-bar"],
  ],
};

describe("glyph keypad rules", () => {
  it.each<[GlyphKeypadGlyph[], number[] | null]>([
    [["hexagon-zigzag", "circle-dot", "circle-bar", "arch-plus"], [1, 3, 0, 2]], // only in column 1
    [["square-bar", "triangle-dot", "hexagon-ring", "circle-dot"], [1, 3, 2, 0]], // only in column 2
    [["circle-dot", "square-bar", "arch-plus", "diamond-ring"], [0, 1, 2, 3]], // already in order
    [["circle-dot", "square-bar", "arch-plus", "triangle-dot"], null], // fits both columns
    [["circle-dot", "square-bar", "arch-plus", "arch-ring"], null], // fits no column
  ])("%j presses positions %j", (glyphs, expected) => {
    expect(glyphKeypadOrder(rules, glyphs)).toEqual(expected);
  });

  it("rejects columns that share four glyphs and accepts columns that share three", () => {
    expect(glyphKeypadColumnsAreDistinct(rules.columns)).toBe(false);
    const three = [rules.columns[0]!, rules.columns[1]!.map((g) => (g === "triangle-dot" ? "arch-ring" : g))];
    expect(glyphKeypadColumnsAreDistinct(three)).toBe(true);
  });

  it("defines 30 distinct glyphs", () => {
    expect(new Set(GLYPH_KEYPAD_GLYPHS).size).toBe(30);
    expect(GLYPH_KEYPAD_GLYPHS).toContain("circle-dot");
    expect(GLYPH_KEYPAD_GLYPHS).toContain("arch-zigzag");
  });
});

describe("glyph keypad module", () => {
  const state: GlyphKeypadState = {
    glyphs: ["hexagon-zigzag", "circle-dot", "circle-bar", "arch-plus"],
    pressed: [false, false, false, false],
  };
  const ctx = ctxFor(rules);

  it("marks a correct press", () => {
    expect(glyphKeypad.apply(state, { type: "press", position: 1 }, ctx)).toEqual({
      state: { glyphs: state.glyphs, pressed: [false, true, false, false] },
    });
  });

  it("strikes on a wrong press and keeps progress", () => {
    const partway = { ...state, pressed: [false, true, false, true] };
    expect(glyphKeypad.apply(partway, { type: "press", position: 2 }, ctx)).toEqual({ state: partway, strike: true });
  });

  it("solves on the fourth correct press", () => {
    const last = { ...state, pressed: [true, true, false, true] };
    expect(glyphKeypad.apply(last, { type: "press", position: 2 }, ctx)).toEqual({
      state: { glyphs: state.glyphs, pressed: [true, true, true, true] },
      solved: true,
    });
  });

  it("ignores a key that is already pressed", () => {
    const partway = { ...state, pressed: [false, true, false, false] };
    expect(glyphKeypad.apply(partway, { type: "press", position: 1 }, ctx)).toEqual({ state: partway });
  });

  it("hints the next key in column order", () => {
    expect(glyphKeypad.hint(state, ctx)).toEqual({ type: "press", position: 1 });
    expect(glyphKeypad.hint({ ...state, pressed: [false, true, false, true] }, ctx)).toEqual({
      type: "press",
      position: 0,
    });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(glyphKeypad.parseAction({ type: "press", position: 3 })).toEqual({ type: "press", position: 3 });
    expect(glyphKeypad.parseAction({ type: "press", position: 4 })).toBeNull();
    expect(glyphKeypad.parseAction({ type: "press", position: 1.5 })).toBeNull();
    expect(glyphKeypad.parseAction({ type: "cut", position: 1 })).toBeNull();
    expect(glyphKeypad.parseAction([0])).toBeNull();
  });

  it("generates the same rules for the same rule seed: six distinct columns of seven", () => {
    const a = glyphKeypad.generateRules(createRng("rules:77").fork("glyph-keypad"));
    const b = glyphKeypad.generateRules(createRng("rules:77").fork("glyph-keypad"));
    expect(a).toEqual(b);
    expect(a.columns.map((c) => new Set(c).size)).toEqual([7, 7, 7, 7, 7, 7]);
    expect(a.columns.flat().every((g) => GLYPH_KEYPAD_GLYPHS.includes(g))).toBe(true);
    expect(glyphKeypadColumnsAreDistinct(a.columns)).toBe(true);
    expect(new Set(a.columns.flat()).size).toBeLessThan(42);
  });

  it("generates four keys from one column", () => {
    const generated = glyphKeypad.generateRules(createRng("rules:5").fork("glyph-keypad"));
    const made = glyphKeypad.generate(createRng("bomb"), { edgework: ctx.edgework }, generated);
    expect(made.pressed).toEqual([false, false, false, false]);
    expect(new Set(made.glyphs).size).toBe(4);
    expect(glyphKeypadOrder(generated, made.glyphs)).toHaveLength(4);
  });

  it("plays 200 random instances to completion by following hint", () => {
    for (const seed of ["rules:1", "rules:2", "rules:3"]) {
      const generated = glyphKeypad.generateRules(createRng(seed).fork("glyph-keypad"));
      expect(checkModuleSolvable(glyphKeypad, generated, { samples: 200, seed: "other" })).toEqual({ ok: true });
    }
  });

  it("flags a rule set where four keys fit two columns", () => {
    const column = rules.columns[0]!;
    expect(checkModuleSolvable(glyphKeypad, { columns: [column, [...column].reverse()] }, { samples: 50 }).ok).toBe(
      false,
    );
  });
});
