import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import {
  wirePanels,
  wirePanelsMustCut,
  type WirePanelsColor,
  type WirePanelsPanel,
  type WirePanelsRules,
  type WirePanelsState,
  type WirePanelsWire,
} from "../../src/modules/wire-panels";
import { ctxFor, edgework } from "../helpers";

const rules: WirePanelsRules = {
  tables: {
    red: [["A"], ["B", "C"], ["C"], ["A", "B"], ["A"], ["B"], ["C"], ["A", "C"], ["B"]],
    blue: [["B"], ["B"], ["A", "C"], ["C"], ["A"], ["A", "B"], ["B"], ["C"], ["A"]],
    black: [["C"], ["A"], ["A", "B"], ["B"], ["B", "C"], ["C"], ["A"], ["B"], ["A", "C"]],
  },
};

const A = 0;
const B = 1;
const C = 2;
const wire = (color: WirePanelsColor, to: number, cut = false): WirePanelsWire => ({ color, to, cut });

const panels: WirePanelsPanel[] = [
  [wire("red", A), wire("blue", A), wire("red", A)], // red 1 to A: cut. blue 1 to A: leave. red 2 to A: leave.
  [null, wire("black", C), null], // black 1 to C: cut.
  [wire("blue", B), null, wire("red", C)], // blue 2 to B: cut. red 3 to C: cut.
  [wire("black", B), wire("black", B), wire("blue", B)], // black 2 leave, black 3 cut, blue 3 leave.
];

describe("wire panels rules", () => {
  it("counts each color across panels, top to bottom", () => {
    expect(wirePanelsMustCut(rules, panels)).toEqual([
      [true, false, false],
      [false, true, false],
      [true, false, true],
      [false, true, false],
    ]);
  });

  it("still counts a wire that has been cut", () => {
    const cutFirst = [[wire("red", B, true), wire("red", B), null]];
    expect(wirePanelsMustCut(rules, cutFirst)).toEqual([[false, true, false]]);
  });

  it("leaves a wire beyond the ninth of its color", () => {
    const ten = Array.from({ length: 4 }, () => [wire("red", A), wire("red", A), wire("red", A)]);
    // Red to A is cut on the 1st, 4th, 5th and 8th occurrence; the 10th and later are off the table.
    expect(wirePanelsMustCut(rules, ten)).toEqual([
      [true, false, false],
      [true, true, false],
      [false, true, false],
      [false, false, false],
    ]);
  });
});

describe("wire panels module", () => {
  const ctx = ctxFor(rules, { edgework: edgework() });
  const state: WirePanelsState = { panels, page: 0 };
  const withCut = (page: number, index: number, from: WirePanelsPanel[] = panels) =>
    from.map((panel, p) => (p === page ? panel.map((w, i) => (w && i === index ? { ...w, cut: true } : w)) : panel));

  it("cuts a wire that must be cut without solving or striking", () => {
    expect(wirePanels.apply(state, { type: "cut", index: 0 }, ctx)).toEqual({
      state: { panels: withCut(0, 0), page: 0 },
    });
  });

  it("strikes on a wire that must stay, and leaves it cut", () => {
    expect(wirePanels.apply(state, { type: "cut", index: 1 }, ctx)).toEqual({
      state: { panels: withCut(0, 1), page: 0 },
      strike: true,
    });
  });

  it("ignores an empty post and a wire that is already cut", () => {
    const second: WirePanelsState = { panels, page: 1 };
    expect(wirePanels.apply(second, { type: "cut", index: 0 }, ctx)).toEqual({ state: second });
    const done: WirePanelsState = { panels: withCut(0, 0), page: 0 };
    expect(wirePanels.apply(done, { type: "cut", index: 0 }, ctx)).toEqual({ state: done });
  });

  it("strikes and stays when next is pressed with a wire left to cut", () => {
    expect(wirePanels.apply(state, { type: "next" }, ctx)).toEqual({ state, strike: true });
  });

  it("turns to the next panel when the current one is clean", () => {
    const clean: WirePanelsState = { panels: withCut(0, 0), page: 0 };
    expect(wirePanels.apply(clean, { type: "next" }, ctx)).toEqual({ state: { panels: clean.panels, page: 1 } });
  });

  it("turns past a panel where a wrong wire was cut but nothing is owed", () => {
    const messy: WirePanelsState = { panels: withCut(0, 1, withCut(0, 0)), page: 0 };
    expect(wirePanels.apply(messy, { type: "next" }, ctx)).toEqual({ state: { panels: messy.panels, page: 1 } });
  });

  it("solves on next from the last panel when it is clean", () => {
    const last: WirePanelsState = { panels: withCut(3, 1), page: 3 };
    expect(wirePanels.apply(last, { type: "next" }, ctx)).toEqual({ state: last, solved: true });
  });

  it("strikes on next from the last panel when a wire is left", () => {
    const last: WirePanelsState = { panels, page: 3 };
    expect(wirePanels.apply(last, { type: "next" }, ctx)).toEqual({ state: last, strike: true });
  });

  it("hints each cut on the panel, then next", () => {
    const third: WirePanelsState = { panels, page: 2 };
    expect(wirePanels.hint(third, ctx)).toEqual({ type: "cut", index: 0 });
    expect(wirePanels.hint({ panels: withCut(2, 0), page: 2 }, ctx)).toEqual({ type: "cut", index: 2 });
    expect(wirePanels.hint({ panels: withCut(2, 2, withCut(2, 0)), page: 2 }, ctx)).toEqual({ type: "next" });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(wirePanels.parseAction({ type: "cut", index: 2 })).toEqual({ type: "cut", index: 2 });
    expect(wirePanels.parseAction({ type: "next", index: 7 })).toEqual({ type: "next" });
    expect(wirePanels.parseAction({ type: "cut", index: 3 })).toBeNull();
    expect(wirePanels.parseAction({ type: "cut" })).toBeNull();
    expect(wirePanels.parseAction({ type: "back" })).toBeNull();
    expect(wirePanels.parseAction("next")).toBeNull();
  });

  it("generates the same rules for the same rule seed, nine rows per color", () => {
    const a = wirePanels.generateRules(createRng("rules:77").fork("wire-panels"));
    const b = wirePanels.generateRules(createRng("rules:77").fork("wire-panels"));
    expect(a).toEqual(b);
    expect(Object.keys(a.tables)).toEqual(["red", "blue", "black"]);
    for (const table of Object.values(a.tables)) {
      expect(table).toHaveLength(9);
      for (const letters of table) {
        expect(letters.length === 1 || letters.length === 2).toBe(true);
        expect([...letters].sort()).toEqual(letters);
        expect(letters.every((l) => ["A", "B", "C"].includes(l))).toBe(true);
      }
    }
    expect(a.tables.red).not.toEqual(a.tables.blue);
  });

  it("builds four panels of one to three wires, each to its own right post", () => {
    for (let i = 0; i < 200; i++) {
      const instance = wirePanels.generate(createRng(`bomb:${i}`), { edgework: edgework() }, rules);
      expect(instance.page).toBe(0);
      expect(instance.panels).toHaveLength(4);
      for (const panel of instance.panels) {
        expect(panel).toHaveLength(3);
        const present = panel.filter((w) => w !== null);
        expect(present.length).toBeGreaterThanOrEqual(1);
        expect(new Set(present.map((w) => w.to)).size).toBe(present.length);
        expect(present.every((w) => !w.cut && w.to >= 0 && w.to <= 2)).toBe(true);
      }
    }
  });

  it("plays 200 random instances to completion by following the hint", () => {
    for (const seed of ["rules:1", "rules:2", "rules:3"]) {
      const generated = wirePanels.generateRules(createRng(seed).fork("wire-panels"));
      expect(checkModuleSolvable(wirePanels, generated, { samples: 200, seed: "other" })).toEqual({ ok: true });
    }
  });
});
