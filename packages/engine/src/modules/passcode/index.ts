import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleDef } from "../../types";

/** Five-letter kitchen words. Each manual lists a sample of these. */
export const PASSCODE_WORD_POOL = [
  "APPLE",
  "BACON",
  "BAGEL",
  "BASIL",
  "BASTE",
  "BERRY",
  "BLEND",
  "BREAD",
  "BRINE",
  "BROTH",
  "CANDY",
  "CAPER",
  "CHARD",
  "CHILI",
  "CHIVE",
  "CIDER",
  "CLOVE",
  "COCOA",
  "CREAM",
  "CREPE",
  "CRUST",
  "CUMIN",
  "CURRY",
  "DONUT",
  "DOUGH",
  "FEAST",
  "FLOUR",
  "FUDGE",
  "GRAPE",
  "GRAVY",
  "GRILL",
  "GUAVA",
  "GUMBO",
  "HONEY",
  "JELLY",
  "JUICE",
  "KEBAB",
  "KNEAD",
  "KNIFE",
  "LADLE",
  "LATTE",
  "LEMON",
  "MANGO",
  "MAPLE",
  "MELON",
  "MOCHA",
  "NACHO",
  "OLIVE",
  "ONION",
  "PASTA",
  "PEACH",
  "PECAN",
  "PESTO",
  "PIZZA",
  "PLATE",
  "PRAWN",
  "RAMEN",
  "ROAST",
  "SALAD",
  "SALSA",
  "SAUCE",
  "SCONE",
  "SLICE",
  "SPICE",
  "SPOON",
  "STEAK",
  "SUGAR",
  "SUSHI",
  "SYRUP",
  "TOAST",
] as const;

export const PASSCODE_RULE_WORD_COUNT = 35;
export const PASSCODE_WHEEL_COUNT = 5;
export const PASSCODE_WHEEL_SIZE = 6;

const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export interface PasscodeRules {
  /** The words the manual lists, in alphabetical order. */
  words: string[];
}

export interface PasscodeState {
  /** One entry per wheel, left to right. Each wheel holds six different letters. */
  wheels: string[][];
  /** Index into each wheel of the letter now showing. */
  showing: number[];
}

export type PasscodeAction = { type: "spin"; wheel: number; dir: 1 | -1 } | { type: "submit" };

function spellable(word: string, wheels: string[][]): boolean {
  return word.length === wheels.length && wheels.every((wheel, i) => wheel.includes(word[i] as string));
}

/** The one listed word these wheels can spell, or null when there is none or more than one. */
export function passcodeTarget(rules: PasscodeRules, wheels: string[][]): string | null {
  const matches = rules.words.filter((word) => spellable(word, wheels));
  return matches.length === 1 ? (matches[0] as string) : null;
}

export function passcodeShowing(state: PasscodeState): string {
  return state.wheels.map((wheel, i) => wheel[state.showing[i] ?? 0] ?? "").join("");
}

function drawWheels(rng: Rng, target: string): PasscodeState {
  const wheels = [...target].map((letter) =>
    rng.shuffle([
      letter,
      ...rng.sample(
        ALPHABET.filter((l) => l !== letter),
        PASSCODE_WHEEL_SIZE - 1,
      ),
    ]),
  );
  return { wheels, showing: wheels.map(() => 0) };
}

export const passcode: ModuleDef<"passcode", PasscodeState, PasscodeAction, PasscodeRules> = {
  id: "passcode",
  name: "Passcode",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      (rng) => ({ words: rng.sample(PASSCODE_WORD_POOL, PASSCODE_RULE_WORD_COUNT).sort() }),
      (rules) => checkModuleSolvable(passcode, rules).ok,
    );
  },

  generate(rng, _bomb, rules) {
    const target = rng.pick(rules.words);
    for (let attempt = 0; attempt < 1000; attempt++) {
      const state = drawWheels(rng.fork(`wheels${attempt}`), target);
      // a bomb that starts on the answer would need no Expert at all
      if (passcodeTarget(rules, state.wheels) === target && passcodeShowing(state) !== target) return state;
    }
    throw new Error(`No unambiguous passcode wheels for ${target} (rng key ${rng.key})`);
  },

  apply(state, action, ctx) {
    if (action.type === "spin") {
      const wheel = state.wheels[action.wheel];
      if (!wheel) return { state };
      const showing = state.showing.map((at, i) =>
        i === action.wheel ? (at + action.dir + wheel.length) % wheel.length : at,
      );
      return { state: { ...state, showing } };
    }
    return passcodeShowing(state) === passcodeTarget(ctx.rules, state.wheels)
      ? { state, solved: true }
      : { state, strike: true };
  },

  hint(state, ctx) {
    const target = passcodeTarget(ctx.rules, state.wheels);
    if (target === null) return null;
    for (let i = 0; i < state.wheels.length; i++) {
      const wheel = state.wheels[i] as string[];
      const forward =
        (wheel.indexOf(target[i] as string) - (state.showing[i] ?? 0) + wheel.length) % wheel.length;
      if (forward !== 0) return { type: "spin", wheel: i, dir: forward <= wheel.length / 2 ? 1 : -1 };
    }
    return { type: "submit" };
  },

  parseAction(raw) {
    if (!isRecord(raw)) return null;
    if (raw.type === "submit") return { type: "submit" };
    if (raw.type !== "spin" || !isInt(raw.wheel, 0, PASSCODE_WHEEL_COUNT - 1)) return null;
    if (raw.dir !== 1 && raw.dir !== -1) return null;
    return { type: "spin", wheel: raw.wheel, dir: raw.dir };
  },
};
