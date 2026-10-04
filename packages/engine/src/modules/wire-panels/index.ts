import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleDef } from "../../types";

export const WIRE_PANELS_COLORS = ["red", "blue", "black"] as const;
export type WirePanelsColor = (typeof WIRE_PANELS_COLORS)[number];

export const WIRE_PANELS_LETTERS = ["A", "B", "C"] as const;
export type WirePanelsLetter = (typeof WIRE_PANELS_LETTERS)[number];

export const WIRE_PANELS_PANEL_COUNT = 4;
export const WIRE_PANELS_POSTS = 3;
/** The manual's tables stop here, so no bomb carries more wires of one color. */
export const WIRE_PANELS_MAX_OCCURRENCE = 9;

export interface WirePanelsRules {
  /** Per color, one entry per occurrence (first to ninth): cut when the wire ends at one of these letters. */
  tables: Record<WirePanelsColor, WirePanelsLetter[][]>;
}

export interface WirePanelsWire {
  color: WirePanelsColor;
  /** Right post, as an index into `WIRE_PANELS_LETTERS`. */
  to: number;
  cut: boolean;
}

/** One slot per left post, top to bottom. Null is an empty post. */
export type WirePanelsPanel = (WirePanelsWire | null)[];

export interface WirePanelsState {
  panels: WirePanelsPanel[];
  /** Index of the panel on show. */
  page: number;
}

export type WirePanelsAction = { type: "cut"; index: number } | { type: "next" };

/** For every post on every panel, whether the manual says its wire must be cut. */
export function wirePanelsMustCut(rules: WirePanelsRules, panels: WirePanelsPanel[]): boolean[][] {
  const seen: Record<WirePanelsColor, number> = { red: 0, blue: 0, black: 0 };
  return panels.map((panel) =>
    panel.map((wire) => {
      if (!wire) return false;
      const letters = rules.tables[wire.color][seen[wire.color]];
      seen[wire.color] += 1;
      const letter = WIRE_PANELS_LETTERS[wire.to];
      return letters !== undefined && letter !== undefined && letters.includes(letter);
    }),
  );
}

function pending(rules: WirePanelsRules, state: WirePanelsState): number[] {
  const must = wirePanelsMustCut(rules, state.panels)[state.page] ?? [];
  const panel = state.panels[state.page] ?? [];
  return must.flatMap((needed, i) => (needed && panel[i]?.cut === false ? [i] : []));
}

function propose(rng: Rng): WirePanelsRules {
  const table = (colorRng: Rng) =>
    Array.from({ length: WIRE_PANELS_MAX_OCCURRENCE }, () => {
      const picked = colorRng.sample(WIRE_PANELS_LETTERS, colorRng.int(1, 2));
      return WIRE_PANELS_LETTERS.filter((letter) => picked.includes(letter));
    });
  return { tables: { red: table(rng.fork("red")), blue: table(rng.fork("blue")), black: table(rng.fork("black")) } };
}

export const wirePanels: ModuleDef<"wire-panels", WirePanelsState, WirePanelsAction, WirePanelsRules> = {
  id: "wire-panels",
  name: "Wire Panels",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(ruleRng, propose, (rules) => checkModuleSolvable(wirePanels, rules, { samples: 200 }).ok);
  },

  generate(rng) {
    const used: Record<WirePanelsColor, number> = { red: 0, blue: 0, black: 0 };
    const panels = Array.from({ length: WIRE_PANELS_PANEL_COUNT }, () => {
      const posts = rng.shuffle([0, 1, 2]);
      const wired = rng.sample([0, 1, 2], rng.int(1, WIRE_PANELS_POSTS));
      return Array.from({ length: WIRE_PANELS_POSTS }, (_, i): WirePanelsWire | null => {
        if (!wired.includes(i)) return null;
        const color = rng.pick(WIRE_PANELS_COLORS.filter((c) => used[c] < WIRE_PANELS_MAX_OCCURRENCE));
        used[color] += 1;
        return { color, to: posts[i] as number, cut: false };
      });
    });
    return { panels, page: 0 };
  },

  apply(state, action, ctx) {
    const todo = pending(ctx.rules, state);
    if (action.type === "next") {
      if (state.page >= state.panels.length) return { state };
      if (todo.length > 0) return { state, strike: true };
      if (state.page === state.panels.length - 1) return { state, solved: true };
      return { state: { ...state, page: state.page + 1 } };
    }
    const wire = state.panels[state.page]?.[action.index];
    if (!wire || wire.cut) return { state };
    const panels = state.panels.map((panel, p) =>
      p === state.page ? panel.map((w, i) => (w && i === action.index ? { ...w, cut: true } : w)) : panel,
    );
    const next = { ...state, panels };
    return todo.includes(action.index) ? { state: next } : { state: next, strike: true };
  },

  hint(state, ctx) {
    const [index] = pending(ctx.rules, state);
    return index === undefined ? { type: "next" } : { type: "cut", index };
  },

  parseAction(raw) {
    if (!isRecord(raw)) return null;
    if (raw.type === "next") return { type: "next" };
    if (raw.type === "cut" && isInt(raw.index, 0, WIRE_PANELS_POSTS - 1)) return { type: "cut", index: raw.index };
    return null;
  },
};
