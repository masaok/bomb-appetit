import { serialHasVowel } from "../../edgework";
import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isRecord, type ModuleContext, type ModuleDef } from "../../types";

export const COLOR_ECHO_COLORS = ["red", "blue", "green", "yellow"] as const;
export type ColorEchoColor = (typeof COLOR_ECHO_COLORS)[number];

/** Flashed color to the color to press. Always a permutation. */
export type ColorEchoMapping = Record<ColorEchoColor, ColorEchoColor>;

/** One mapping each for no strikes, one strike, and two or more strikes. */
export type ColorEchoStrikeTables = [ColorEchoMapping, ColorEchoMapping, ColorEchoMapping];

export interface ColorEchoRules {
  /** Used when the serial number has a vowel. */
  vowel: ColorEchoStrikeTables;
  noVowel: ColorEchoStrikeTables;
}

export interface ColorEchoState {
  sequence: ColorEchoColor[];
  /** Zero-based. Stage n flashes the first n + 1 colors. */
  stage: number;
  /** Correct presses so far in this stage. */
  entered: number;
}

export type ColorEchoAction = { type: "press"; color: ColorEchoColor };

/** The mapping table in force for this serial number and strike count. */
export function colorEchoMapping(
  rules: ColorEchoRules,
  hasVowel: boolean,
  strikes: number,
): ColorEchoMapping {
  const tables = hasVowel ? rules.vowel : rules.noVowel;
  return tables[strikes <= 0 ? 0 : strikes === 1 ? 1 : 2];
}

function expectedPress(state: ColorEchoState, ctx: ModuleContext<ColorEchoRules>): ColorEchoColor | null {
  const flashed = state.entered <= state.stage ? state.sequence[state.entered] : undefined;
  if (flashed === undefined) return null;
  return colorEchoMapping(ctx.rules, serialHasVowel(ctx.edgework), ctx.strikes)[flashed];
}

function proposeMapping(rng: Rng): ColorEchoMapping {
  const to = rng.shuffle(COLOR_ECHO_COLORS);
  return { red: to[0]!, blue: to[1]!, green: to[2]!, yellow: to[3]! };
}

function propose(rng: Rng): ColorEchoRules {
  const tables = (): ColorEchoStrikeTables => [proposeMapping(rng), proposeMapping(rng), proposeMapping(rng)];
  return { vowel: tables(), noVowel: tables() };
}

function isPermutation(mapping: ColorEchoMapping): boolean {
  return new Set(COLOR_ECHO_COLORS.map((c) => mapping[c])).size === COLOR_ECHO_COLORS.length;
}

/** Rejects manuals with a table that maps every color to itself, or with two identical tables. */
function isInteresting(rules: ColorEchoRules): boolean {
  const tables = [...rules.vowel, ...rules.noVowel];
  const keys = tables.map((t) => COLOR_ECHO_COLORS.map((c) => t[c]).join());
  return (
    tables.every(isPermutation) &&
    new Set(keys).size === keys.length &&
    !keys.includes(COLOR_ECHO_COLORS.join())
  );
}

export const colorEcho: ModuleDef<"color-echo", ColorEchoState, ColorEchoAction, ColorEchoRules> = {
  id: "color-echo",
  name: "Color Echo",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => isInteresting(rules) && checkModuleSolvable(colorEcho, rules).ok,
    );
  },

  generate(rng) {
    const sequence = Array.from({ length: rng.int(3, 5) }, () => rng.pick(COLOR_ECHO_COLORS));
    return { sequence, stage: 0, entered: 0 };
  },

  apply(state, action, ctx) {
    const expected = expectedPress(state, ctx);
    if (expected === null) return { state };
    if (action.color !== expected) return { state: { ...state, entered: 0 }, strike: true };

    const entered = state.entered + 1;
    if (entered <= state.stage) return { state: { ...state, entered } };
    if (state.stage + 1 >= state.sequence.length) return { state: { ...state, entered }, solved: true };
    return { state: { ...state, stage: state.stage + 1, entered: 0 } };
  },

  hint(state, ctx) {
    const color = expectedPress(state, ctx);
    return color === null ? null : { type: "press", color };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "press") return null;
    const color = COLOR_ECHO_COLORS.find((c) => c === raw.color);
    return color ? { type: "press", color } : null;
  },
};
