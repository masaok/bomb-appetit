import { serialIsOdd } from "../../edgework";
import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleContext, type ModuleDef } from "../../types";

export const WIRE_COLORS = ["red", "blue", "yellow", "white", "black"] as const;
export type WireColor = (typeof WIRE_COLORS)[number];

export const WIRE_COUNTS = [3, 4, 5, 6] as const;
export type WireCount = (typeof WIRE_COUNTS)[number];

export type WireCondition =
  | { kind: "count"; color: WireColor; cmp: "none" | "exactly" | "moreThan"; n: number }
  | { kind: "lastIs"; color: WireColor }
  | { kind: "serial"; parity: "odd" | "even" };

export type WireTarget =
  | { kind: "position"; index: number }
  | { kind: "last" }
  | { kind: "firstOf"; color: WireColor }
  | { kind: "lastOf"; color: WireColor };

export interface WireRule {
  /** Every condition must hold. */
  when: WireCondition[];
  cut: WireTarget;
}

export interface WireClause {
  count: WireCount;
  /** Read top to bottom; the first rule whose conditions all hold wins. */
  rules: WireRule[];
  otherwise: WireTarget;
}

export interface WiresRules {
  clauses: WireClause[];
}

export interface WiresState {
  wires: WireColor[];
  cut: boolean[];
}

export type WiresAction = { type: "cut"; index: number };

function holds(condition: WireCondition, wires: WireColor[], serialOdd: boolean): boolean {
  switch (condition.kind) {
    case "count": {
      const count = wires.filter((w) => w === condition.color).length;
      if (condition.cmp === "none") return count === 0;
      if (condition.cmp === "exactly") return count === condition.n;
      return count > condition.n;
    }
    case "lastIs":
      return wires[wires.length - 1] === condition.color;
    case "serial":
      return serialOdd === (condition.parity === "odd");
  }
}

function resolve(target: WireTarget, wires: WireColor[]): number {
  switch (target.kind) {
    case "position":
      return target.index;
    case "last":
      return wires.length - 1;
    case "firstOf":
      return wires.indexOf(target.color);
    case "lastOf":
      return wires.lastIndexOf(target.color);
  }
}

/** Index of the one wire the manual says to cut, or -1 when the rules do not cover this bomb. */
export function wireToCut(rules: WiresRules, wires: WireColor[], serialOdd: boolean): number {
  const clause = rules.clauses.find((c) => c.count === wires.length);
  if (!clause) return -1;
  const rule = clause.rules.find((r) => r.when.every((c) => holds(c, wires, serialOdd)));
  const index = resolve(rule ? rule.cut : clause.otherwise, wires);
  return index >= 0 && index < wires.length ? index : -1;
}

function proposeCondition(rng: Rng, count: WireCount): { condition: WireCondition; guaranteed?: WireColor } {
  const color = rng.pick(WIRE_COLORS);
  const roll = rng.int(0, 5);
  if (roll === 0) return { condition: { kind: "serial", parity: rng.pick(["odd", "even"] as const) } };
  if (roll === 1) return { condition: { kind: "lastIs", color }, guaranteed: color };
  if (roll === 2) return { condition: { kind: "count", color, cmp: "none", n: 0 } };
  if (roll === 3) {
    return { condition: { kind: "count", color, cmp: "exactly", n: rng.int(1, 2) }, guaranteed: color };
  }
  return {
    condition: { kind: "count", color, cmp: "moreThan", n: rng.int(0, count > 4 ? 2 : 1) },
    guaranteed: color,
  };
}

function proposeTarget(rng: Rng, count: WireCount, guaranteed: WireColor[]): WireTarget {
  if (guaranteed.length > 0 && rng.bool(0.6)) {
    return { kind: rng.pick(["firstOf", "lastOf"] as const), color: rng.pick(guaranteed) };
  }
  return rng.bool(0.3) ? { kind: "last" } : { kind: "position", index: rng.int(0, count - 1) };
}

function propose(rng: Rng): WiresRules {
  return {
    clauses: WIRE_COUNTS.map((count) => {
      const rules: WireRule[] = [];
      for (let i = 0, n = rng.int(3, 4); i < n; i++) {
        const first = proposeCondition(rng, count);
        const second = rng.bool(0.3) ? proposeCondition(rng, count) : null;
        const guaranteed = [first.guaranteed, second?.guaranteed].filter((c) => c !== undefined);
        rules.push({
          when: second ? [first.condition, second.condition] : [first.condition],
          cut: proposeTarget(rng, count, guaranteed),
        });
      }
      return { count, rules, otherwise: proposeTarget(rng, count, []) };
    }),
  };
}

/** Rejects manuals where a rule can never fire or one branch swallows nearly every bomb. */
function isInteresting(rules: WiresRules): boolean {
  return rules.clauses.every((clause) =>
    clause.rules.every((rule) => {
      const colors = rule.when.filter((c) => c.kind !== "serial").map((c) => c.color);
      return new Set(colors).size === colors.length;
    }),
  );
}

export const wires: ModuleDef<"wires", WiresState, WiresAction, WiresRules> = {
  id: "wires",
  name: "Wires",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => isInteresting(rules) && checkModuleSolvable(wires, rules).ok,
    );
  },

  generate(rng) {
    const count = rng.pick(WIRE_COUNTS);
    const wireColors = Array.from({ length: count }, () => rng.pick(WIRE_COLORS));
    return { wires: wireColors, cut: wireColors.map(() => false) };
  },

  apply(state, action, ctx) {
    if (action.index >= state.wires.length || state.cut[action.index]) return { state };
    const next = { ...state, cut: state.cut.map((c, i) => c || i === action.index) };
    const correct = wireToCut(ctx.rules, state.wires, serialIsOdd(ctx.edgework));
    return action.index === correct ? { state: next, solved: true } : { state: next, strike: true };
  },

  hint(state, ctx: ModuleContext<WiresRules>) {
    const index = wireToCut(ctx.rules, state.wires, serialIsOdd(ctx.edgework));
    return index < 0 ? null : { type: "cut", index };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "cut" || !isInt(raw.index, 0, 5)) return null;
    return { type: "cut", index: raw.index };
  },
};
