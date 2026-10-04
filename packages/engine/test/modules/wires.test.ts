import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng } from "../../src";
import { wires, wireToCut, type WireColor, type WiresRules } from "../../src/modules/wires";
import { ctxFor, edgework } from "../helpers";

const rules: WiresRules = {
  clauses: [
    {
      count: 3,
      rules: [
        { when: [{ kind: "count", color: "red", cmp: "none", n: 0 }], cut: { kind: "position", index: 1 } },
        { when: [{ kind: "lastIs", color: "white" }], cut: { kind: "last" } },
        { when: [{ kind: "count", color: "blue", cmp: "moreThan", n: 1 }], cut: { kind: "lastOf", color: "blue" } },
      ],
      otherwise: { kind: "last" },
    },
    {
      count: 4,
      rules: [
        {
          when: [{ kind: "count", color: "red", cmp: "moreThan", n: 1 }, { kind: "serial", parity: "odd" }],
          cut: { kind: "lastOf", color: "red" },
        },
        { when: [{ kind: "count", color: "blue", cmp: "exactly", n: 1 }], cut: { kind: "firstOf", color: "blue" } },
      ],
      otherwise: { kind: "position", index: 1 },
    },
    { count: 5, rules: [], otherwise: { kind: "position", index: 0 } },
    { count: 6, rules: [], otherwise: { kind: "position", index: 3 } },
  ],
};

describe("wires rules", () => {
  it.each<[WireColor[], boolean, number]>([
    [["blue", "yellow", "black"], false, 1], // no red
    [["red", "blue", "white"], false, 2], // last is white
    [["blue", "red", "blue"], false, 2], // more than one blue: last blue
    [["red", "yellow", "black"], false, 2], // otherwise: last
    [["red", "red", "blue", "red"], true, 3], // >1 red and odd serial: last red
    [["red", "red", "blue", "red"], false, 2], // even serial falls through to exactly one blue
    [["red", "red", "black", "red"], false, 1], // otherwise: second
    [["red", "blue", "red", "blue", "red", "blue"], true, 3], // six wires: fourth
  ])("%j with odd serial %s cuts wire %i", (colors, serialOdd, expected) => {
    expect(wireToCut(rules, colors, serialOdd)).toBe(expected);
  });
});

describe("wires module", () => {
  const state = { wires: ["red", "blue", "white"] as WireColor[], cut: [false, false, false] };
  const ctx = ctxFor(rules, { edgework: edgework({ serial: "AB1CD2" }) });

  it("solves on the correct cut", () => {
    expect(wires.apply(state, { type: "cut", index: 2 }, ctx)).toEqual({
      state: { wires: ["red", "blue", "white"], cut: [false, false, true] },
      solved: true,
    });
  });

  it("strikes on a wrong cut and leaves that wire cut", () => {
    expect(wires.apply(state, { type: "cut", index: 0 }, ctx)).toEqual({
      state: { wires: ["red", "blue", "white"], cut: [true, false, false] },
      strike: true,
    });
  });

  it("ignores a wire that is already cut or does not exist", () => {
    const cut = { ...state, cut: [true, false, false] };
    expect(wires.apply(cut, { type: "cut", index: 0 }, ctx)).toEqual({ state: cut });
    expect(wires.apply(state, { type: "cut", index: 5 }, ctx)).toEqual({ state });
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(wires.parseAction({ type: "cut", index: 2 })).toEqual({ type: "cut", index: 2 });
    expect(wires.parseAction({ type: "cut", index: 2.5 })).toBeNull();
    expect(wires.parseAction({ type: "cut", index: -1 })).toBeNull();
    expect(wires.parseAction("cut")).toBeNull();
  });

  it("generates the same rules for the same rule seed, and solvable ones", () => {
    const a = wires.generateRules(createRng("rules:77").fork("wires"));
    const b = wires.generateRules(createRng("rules:77").fork("wires"));
    expect(a).toEqual(b);
    expect(a.clauses.map((c) => c.count)).toEqual([3, 4, 5, 6]);
    expect(checkModuleSolvable(wires, a, { samples: 300, seed: "other" })).toEqual({ ok: true });
  });

  it("flags a rule set whose target can be missing", () => {
    const broken: WiresRules = {
      clauses: rules.clauses.map((c) => ({ ...c, rules: [], otherwise: { kind: "firstOf", color: "red" } as const })),
    };
    expect(checkModuleSolvable(wires, broken, { samples: 300 }).ok).toBe(false);
  });
});
