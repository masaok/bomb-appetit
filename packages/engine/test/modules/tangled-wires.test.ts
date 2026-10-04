import { describe, expect, it } from "vitest";
import { checkModuleSolvable, createRng, PORT_TYPES, type Edgework } from "../../src";
import {
  tangledWires,
  tangledWiresFlags,
  tangledWiresRegion,
  tangledWiresShouldCut,
  TANGLED_WIRES_INSTRUCTIONS,
  type TangledWiresFlags,
  type TangledWiresRules,
  type TangledWiresState,
} from "../../src/modules/tangled-wires";
import { ctxFor, edgework } from "../helpers";

// Region index: red 1, blue 2, star 4, LED 8.
const rules: TangledWiresRules = {
  port: "coax",
  table: [
    "cut",
    "skip",
    "serial",
    "port", // plain, red, blue, red+blue
    "battery",
    "cut",
    "skip",
    "serial", // the same four with a star
    "port",
    "battery",
    "cut",
    "skip", // the same four with the LED on
    "serial",
    "port",
    "battery",
    "cut", // star and LED
  ],
};

const flags = (red: boolean, blue: boolean, star: boolean, led: boolean): TangledWiresFlags => ({
  red,
  blue,
  star,
  led,
});

const evenSerial = edgework({ serial: "AB1CD2" });
const oddSerial = edgework({ serial: "AB1CD7" });
const withCoax = edgework({ portPlates: [["hex"], ["coax", "slot"]] });
const withoutCoax = edgework({ portPlates: [["hex", "slot"]] });
const twoCells = edgework({ batteries: ["cell", "cell"] });
const onePack = edgework({ batteries: ["pack"] });
const oneCell = edgework({ batteries: ["cell"] });

describe("tangled wires rules", () => {
  it.each<[string, TangledWiresFlags, Edgework, boolean]>([
    ["cut", flags(false, false, false, false), oddSerial, true],
    ["do not cut", flags(true, false, false, false), evenSerial, false],
    ["serial, even", flags(false, true, false, false), evenSerial, true],
    ["serial, odd", flags(false, true, false, false), oddSerial, false],
    ["port, present", flags(true, true, false, false), withCoax, true],
    ["port, absent", flags(true, true, false, false), withoutCoax, false],
    ["battery, two cells", flags(false, false, true, false), twoCells, true],
    ["battery, one pack of two", flags(false, false, true, false), onePack, true],
    ["battery, one cell", flags(false, false, true, false), oneCell, false],
    ["battery, none", flags(false, false, true, false), evenSerial, false],
    ["all four flags", flags(true, true, true, true), oddSerial, true],
    ["star and LED only, serial even", flags(false, false, true, true), evenSerial, true],
    ["red with LED, battery", flags(true, false, false, true), oneCell, false],
  ])("%s", (_label, wire, bomb, expected) => {
    expect(tangledWiresShouldCut(rules, wire, bomb)).toBe(expected);
  });

  it("numbers the sixteen regions by flag", () => {
    expect(tangledWiresRegion(flags(false, false, false, false))).toBe(0);
    expect(tangledWiresRegion(flags(true, false, false, false))).toBe(1);
    expect(tangledWiresRegion(flags(false, true, false, false))).toBe(2);
    expect(tangledWiresRegion(flags(false, false, true, false))).toBe(4);
    expect(tangledWiresRegion(flags(false, false, false, true))).toBe(8);
    expect(tangledWiresRegion(flags(true, true, true, true))).toBe(15);
    expect(tangledWiresFlags(11)).toEqual(flags(true, true, false, true));
  });
});

describe("tangled wires module", () => {
  // Odd serial, no ports, no batteries: only plain "cut" regions need cutting.
  const ctx = ctxFor(rules, { edgework: oddSerial });
  const wires = [
    { ...flags(false, false, false, false), to: 2 }, // cut
    { ...flags(true, false, false, false), to: 0 }, // do not cut
    { ...flags(true, false, true, false), to: 3 }, // cut
    { ...flags(false, true, false, false), to: 1 }, // serial: odd, so leave
  ];
  const state: TangledWiresState = { wires, cut: [false, false, false, false] };

  it("keeps going after a correct cut while another wire still needs cutting", () => {
    expect(tangledWires.apply(state, { type: "cut", index: 0 }, ctx)).toEqual({
      state: { wires, cut: [true, false, false, false] },
    });
  });

  it("solves when the last wire that needs cutting is cut", () => {
    const half = { wires, cut: [true, false, false, false] };
    expect(tangledWires.apply(half, { type: "cut", index: 2 }, ctx)).toEqual({
      state: { wires, cut: [true, false, true, false] },
      solved: true,
    });
  });

  it("strikes on a wire that must stay, and leaves it cut", () => {
    expect(tangledWires.apply(state, { type: "cut", index: 1 }, ctx)).toEqual({
      state: { wires, cut: [false, true, false, false] },
      strike: true,
    });
    expect(tangledWires.apply(state, { type: "cut", index: 3 }, ctx)).toEqual({
      state: { wires, cut: [false, false, false, true] },
      strike: true,
    });
  });

  it("judges the same wire by the bomb it sits on", () => {
    const even = ctxFor(rules, { edgework: evenSerial });
    expect(tangledWires.apply(state, { type: "cut", index: 3 }, even)).toEqual({
      state: { wires, cut: [false, false, false, true] },
    });
  });

  it("ignores a wire that is already cut or does not exist", () => {
    const cut = { wires, cut: [true, true, false, false] };
    expect(tangledWires.apply(cut, { type: "cut", index: 0 }, ctx)).toEqual({ state: cut });
    expect(tangledWires.apply(cut, { type: "cut", index: 1 }, ctx)).toEqual({ state: cut });
    expect(tangledWires.apply(state, { type: "cut", index: 5 }, ctx)).toEqual({ state });
  });

  it("hints the next wire that needs cutting", () => {
    expect(tangledWires.hint(state, ctx)).toEqual({ type: "cut", index: 0 });
    expect(tangledWires.hint({ wires, cut: [true, true, false, false] }, ctx)).toEqual({
      type: "cut",
      index: 2,
    });
    expect(tangledWires.hint({ wires, cut: [true, false, true, false] }, ctx)).toBeNull();
  });

  it("accepts only well-formed actions from a run log", () => {
    expect(tangledWires.parseAction({ type: "cut", index: 5 })).toEqual({ type: "cut", index: 5 });
    expect(tangledWires.parseAction({ type: "cut", index: 6 })).toBeNull();
    expect(tangledWires.parseAction({ type: "cut", index: 1.5 })).toBeNull();
    expect(tangledWires.parseAction({ type: "snip", index: 1 })).toBeNull();
    expect(tangledWires.parseAction(null)).toBeNull();
  });

  it("generates the same rules for the same rule seed, with every instruction in use", () => {
    const a = tangledWires.generateRules(createRng("rules:77").fork("tangled-wires"));
    const b = tangledWires.generateRules(createRng("rules:77").fork("tangled-wires"));
    expect(a).toEqual(b);
    expect(a.table).toHaveLength(16);
    expect(PORT_TYPES).toContain(a.port);
    for (const instruction of TANGLED_WIRES_INSTRUCTIONS) {
      const uses = a.table.filter((entry) => entry === instruction).length;
      expect(uses).toBeGreaterThanOrEqual(3);
      expect(uses).toBeLessThanOrEqual(4);
    }
  });

  it("builds four to six crossing wires with at least one to cut", () => {
    const generated = tangledWires.generateRules(createRng("rules:9").fork("tangled-wires"));
    for (let i = 0; i < 200; i++) {
      const bomb = { edgework: i % 2 === 0 ? oddSerial : twoCells };
      const instance = tangledWires.generate(createRng(`bomb:${i}`), bomb, generated);
      const count = instance.wires.length;
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(6);
      expect(instance.cut).toEqual(Array.from({ length: count }, () => false));
      const slots = instance.wires.map((w) => w.to);
      expect([...slots].sort()).toEqual(Array.from({ length: count }, (_, s) => s));
      expect(slots.some((slot, top) => slot !== top)).toBe(true);
      expect(instance.wires.some((w) => tangledWiresShouldCut(generated, w, bomb.edgework))).toBe(true);
    }
  });

  it("plays 200 random instances to completion by following the hint", () => {
    for (const seed of ["rules:1", "rules:2", "rules:3"]) {
      const generated = tangledWires.generateRules(createRng(seed).fork("tangled-wires"));
      expect(checkModuleSolvable(tangledWires, generated, { samples: 200, seed: "other" })).toEqual({
        ok: true,
      });
    }
  });

  it("flags a rule set that never lets a wire be cut", () => {
    const broken: TangledWiresRules = {
      port: "hex",
      table: Array.from({ length: 16 }, () => "skip" as const),
    };
    expect(checkModuleSolvable(tangledWires, broken, { samples: 20 }).ok).toBe(false);
  });
});
