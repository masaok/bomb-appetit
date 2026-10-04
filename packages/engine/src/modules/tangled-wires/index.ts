import {
  batteryCount,
  hasPort,
  PORT_TYPES,
  serialLastDigit,
  type Edgework,
  type PortType,
} from "../../edgework";
import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleDef } from "../../types";

export const TANGLED_WIRES_INSTRUCTIONS = ["cut", "skip", "serial", "port", "battery"] as const;
export type TangledWiresInstruction = (typeof TANGLED_WIRES_INSTRUCTIONS)[number];

/** The letter the manual prints for each instruction. */
export const TANGLED_WIRES_LETTERS: Record<TangledWiresInstruction, string> = {
  cut: "C",
  skip: "D",
  serial: "S",
  port: "P",
  battery: "B",
};

export const TANGLED_WIRES_COUNTS = [4, 5, 6] as const;

export interface TangledWiresFlags {
  red: boolean;
  blue: boolean;
  star: boolean;
  led: boolean;
}

export interface TangledWiresWire extends TangledWiresFlags {
  /** Bottom slot this wire ends in. Its index in the list is its top slot. */
  to: number;
}

export interface TangledWiresRules {
  /** The port type the "port" instruction asks about. */
  port: PortType;
  /** 16 instructions, indexed by `tangledWiresRegion`. */
  table: TangledWiresInstruction[];
}

export interface TangledWiresState {
  wires: TangledWiresWire[];
  cut: boolean[];
}

export type TangledWiresAction = { type: "cut"; index: number };

/** Table index for a flag combination: red is bit 0, blue bit 1, star bit 2, LED bit 3. */
export function tangledWiresRegion(flags: TangledWiresFlags): number {
  return (flags.red ? 1 : 0) + (flags.blue ? 2 : 0) + (flags.star ? 4 : 0) + (flags.led ? 8 : 0);
}

export function tangledWiresFlags(region: number): TangledWiresFlags {
  return {
    red: (region & 1) !== 0,
    blue: (region & 2) !== 0,
    star: (region & 4) !== 0,
    led: (region & 8) !== 0,
  };
}

export function tangledWiresShouldCut(
  rules: TangledWiresRules,
  flags: TangledWiresFlags,
  edgework: Edgework,
): boolean {
  switch (rules.table[tangledWiresRegion(flags)]) {
    case "cut":
      return true;
    case "serial":
      return serialLastDigit(edgework) % 2 === 0;
    case "port":
      return hasPort(edgework, rules.port);
    case "battery":
      return batteryCount(edgework) >= 2;
    default:
      return false;
  }
}

function propose(rng: Rng): TangledWiresRules {
  // Three of each instruction plus one extra, so no letter crowds out the others.
  const pool = [...TANGLED_WIRES_INSTRUCTIONS, ...TANGLED_WIRES_INSTRUCTIONS, ...TANGLED_WIRES_INSTRUCTIONS];
  pool.push(rng.pick(TANGLED_WIRES_INSTRUCTIONS));
  return { port: rng.pick(PORT_TYPES), table: rng.shuffle(pool) };
}

function deal(rng: Rng): TangledWiresWire[] {
  const count = rng.pick(TANGLED_WIRES_COUNTS);
  let slots = rng.shuffle(Array.from({ length: count }, (_, i) => i));
  // A deal with no crossing would not be tangled at all.
  if (slots.every((slot, i) => slot === i)) slots = [...slots.slice(1), 0];
  return slots.map((to) => ({ red: rng.bool(), blue: rng.bool(), star: rng.bool(), led: rng.bool(), to }));
}

export const tangledWires: ModuleDef<
  "tangled-wires",
  TangledWiresState,
  TangledWiresAction,
  TangledWiresRules
> = {
  id: "tangled-wires",
  name: "Tangled Wires",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => checkModuleSolvable(tangledWires, rules, { samples: 200 }).ok,
    );
  },

  generate(rng, bomb, rules) {
    let wires = deal(rng.fork("try0"));
    // A module with nothing to cut could never be solved, so deal again.
    for (let attempt = 1; attempt < 50; attempt++) {
      if (wires.some((wire) => tangledWiresShouldCut(rules, wire, bomb.edgework))) break;
      wires = deal(rng.fork(`try${attempt}`));
    }
    return { wires, cut: wires.map(() => false) };
  },

  apply(state, action, ctx) {
    const wire = state.wires[action.index];
    if (!wire || state.cut[action.index]) return { state };
    const next = { ...state, cut: state.cut.map((c, i) => c || i === action.index) };
    if (!tangledWiresShouldCut(ctx.rules, wire, ctx.edgework)) return { state: next, strike: true };
    const done = next.wires.every(
      (w, i) => next.cut[i] || !tangledWiresShouldCut(ctx.rules, w, ctx.edgework),
    );
    return done ? { state: next, solved: true } : { state: next };
  },

  hint(state, ctx) {
    const index = state.wires.findIndex(
      (wire, i) => !state.cut[i] && tangledWiresShouldCut(ctx.rules, wire, ctx.edgework),
    );
    return index < 0 ? null : { type: "cut", index };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "cut" || !isInt(raw.index, 0, 5)) return null;
    return { type: "cut", index: raw.index };
  },
};
