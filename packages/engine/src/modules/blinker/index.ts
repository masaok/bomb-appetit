import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isRecord, type ModuleDef } from "../../types";

export const BLINKER_PULSES = ["short", "long"] as const;
export type BlinkerPulse = (typeof BLINKER_PULSES)[number];

export const BLINKER_LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export const BLINKER_WORDS = [
  "BAGEL",
  "BASIL",
  "BRINE",
  "BROTH",
  "CREPE",
  "CRUST",
  "GARLIC",
  "GRAVY",
  "SALSA",
  "SAUTE",
  "SPICE",
  "STEW",
  "TANGY",
  "TOAST",
  "WAFFLE",
  "WHISK",
] as const;

/** In MHz, ascending. The tuner steps through these in order. */
export const BLINKER_FREQUENCIES = [
  "3.505",
  "3.511",
  "3.524",
  "3.533",
  "3.541",
  "3.556",
  "3.562",
  "3.574",
  "3.583",
  "3.591",
  "3.608",
  "3.615",
  "3.629",
  "3.637",
  "3.644",
  "3.658",
] as const;

export const BLINKER_SHORT_MS = 250;
export const BLINKER_LONG_MS = 750;
export const BLINKER_PULSE_GAP_MS = 250;
export const BLINKER_LETTER_GAP_MS = 1000;
export const BLINKER_WORD_GAP_MS = 2500;

export interface BlinkerCodeEntry {
  letter: string;
  pulses: BlinkerPulse[];
}

export interface BlinkerWordEntry {
  word: string;
  /** Index into `BLINKER_FREQUENCIES`. */
  frequency: number;
}

export interface BlinkerRules {
  /** One entry per letter, A to Z. */
  code: BlinkerCodeEntry[];
  words: BlinkerWordEntry[];
}

export interface BlinkerState {
  /** The blinked word, one pulse list per letter. */
  letters: BlinkerPulse[][];
  /** Index into `BLINKER_FREQUENCIES`. */
  tuned: number;
}

export type BlinkerAction = { type: "tune"; dir: 1 | -1 } | { type: "transmit" };

function samePulses(a: BlinkerPulse[], b: BlinkerPulse[]): boolean {
  return a.length === b.length && a.every((pulse, i) => pulse === b[i]);
}

/** The word the pulses spell under this code table, or null when a letter is not in the table. */
export function blinkerDecode(rules: BlinkerRules, letters: BlinkerPulse[][]): string | null {
  let word = "";
  for (const pulses of letters) {
    const entry = rules.code.find((e) => samePulses(e.pulses, pulses));
    if (!entry) return null;
    word += entry.letter;
  }
  return word;
}

/** Frequency index the manual gives for the blinked word, or -1 when the rules do not cover it. */
export function blinkerFrequencyFor(rules: BlinkerRules, letters: BlinkerPulse[][]): number {
  const word = blinkerDecode(rules, letters);
  const entry = rules.words.find((w) => w.word === word);
  return entry && entry.frequency >= 0 && entry.frequency < BLINKER_FREQUENCIES.length ? entry.frequency : -1;
}

/** Length of one full pass through the word, including the pause before it repeats. */
export function blinkerCycleMs(state: BlinkerState): number {
  let total = 0;
  for (const pulses of state.letters) {
    for (const pulse of pulses) total += pulse === "short" ? BLINKER_SHORT_MS : BLINKER_LONG_MS;
    total += Math.max(0, pulses.length - 1) * BLINKER_PULSE_GAP_MS + BLINKER_LETTER_GAP_MS;
  }
  // The pause after the last letter is the word gap, not a letter gap.
  return state.letters.length === 0 ? 0 : total - BLINKER_LETTER_GAP_MS + BLINKER_WORD_GAP_MS;
}

/** Whether the light is lit at `elapsedMs`. The word starts at 0 and loops forever. */
export function blinkerLightOn(state: BlinkerState, elapsedMs: number): boolean {
  const cycle = blinkerCycleMs(state);
  if (cycle === 0 || elapsedMs < 0) return false;
  let t = elapsedMs % cycle;
  for (const pulses of state.letters) {
    for (let i = 0; i < pulses.length; i++) {
      const on = pulses[i] === "short" ? BLINKER_SHORT_MS : BLINKER_LONG_MS;
      if (t < on) return true;
      t -= on;
      if (i < pulses.length - 1) {
        if (t < BLINKER_PULSE_GAP_MS) return false;
        t -= BLINKER_PULSE_GAP_MS;
      }
    }
    if (t < BLINKER_LETTER_GAP_MS) return false;
    t -= BLINKER_LETTER_GAP_MS;
  }
  return false;
}

function propose(rng: Rng): BlinkerRules {
  const sequences: BlinkerPulse[][] = [];
  for (let length = 1; length <= 4; length++) {
    for (let bits = 0; bits < 1 << length; bits++) {
      sequences.push(Array.from({ length }, (_, i) => BLINKER_PULSES[(bits >> i) & 1] as BlinkerPulse));
    }
  }
  const dealt = rng.fork("code").shuffle(sequences);
  const frequencies = rng.fork("words").shuffle(BLINKER_FREQUENCIES.map((_, i) => i));
  return {
    code: BLINKER_LETTERS.map((letter, i) => ({ letter, pulses: dealt[i] as BlinkerPulse[] })),
    words: BLINKER_WORDS.map((word, i) => ({ word, frequency: frequencies[i] as number })),
  };
}

export const blinker: ModuleDef<"blinker", BlinkerState, BlinkerAction, BlinkerRules> = {
  id: "blinker",
  name: "Blinker",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => checkModuleSolvable(blinker, rules, { samples: 200 }).ok,
    );
  },

  generate(rng, _bomb, rules) {
    const { word } = rng.pick(rules.words);
    return {
      letters: [...word].map((letter) => [...(rules.code.find((e) => e.letter === letter)?.pulses ?? [])]),
      tuned: rng.int(0, BLINKER_FREQUENCIES.length - 1),
    };
  },

  apply(state, action, ctx) {
    if (action.type === "tune") {
      const tuned = state.tuned + action.dir;
      if (tuned < 0 || tuned >= BLINKER_FREQUENCIES.length) return { state };
      return { state: { ...state, tuned } };
    }
    return state.tuned === blinkerFrequencyFor(ctx.rules, state.letters)
      ? { state, solved: true }
      : { state, strike: true };
  },

  hint(state, ctx) {
    const target = blinkerFrequencyFor(ctx.rules, state.letters);
    if (target < 0) return null;
    if (state.tuned === target) return { type: "transmit" };
    return { type: "tune", dir: state.tuned < target ? 1 : -1 };
  },

  parseAction(raw) {
    if (!isRecord(raw)) return null;
    if (raw.type === "transmit") return { type: "transmit" };
    if (raw.type === "tune" && (raw.dir === 1 || raw.dir === -1)) return { type: "tune", dir: raw.dir };
    return null;
  },
};
