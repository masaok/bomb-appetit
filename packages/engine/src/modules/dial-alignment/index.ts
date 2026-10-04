import { createRng, type Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isRecord, type ModuleDef } from "../../types";

export const DIAL_ALIGNMENT_WINDOW_MS = 40_000;
export const DIAL_ALIGNMENT_LED_COUNT = 12;

/** Clockwise order: each turn moves the dial to the next entry. */
export const DIAL_ALIGNMENT_DIRECTIONS = ["up", "right", "down", "left"] as const;
export type DialAlignmentDirection = (typeof DIAL_ALIGNMENT_DIRECTIONS)[number];

export interface DialAlignmentPattern {
  /** Twelve LEDs: the top row left to right, then the bottom row. True is lit. */
  leds: boolean[];
  direction: DialAlignmentDirection;
}

export interface DialAlignmentRules {
  patterns: DialAlignmentPattern[];
}

interface Shared {
  dial: DialAlignmentDirection;
  /** Key of the instance's rng, kept so each cycle can draw fresh values. */
  key: string;
  cycle: number;
}

export type DialAlignmentState =
  | (Shared & { kind: "asleep"; wakeAtMs: number })
  | (Shared & { kind: "active"; leds: boolean[]; deadlineMs: number });

export type DialAlignmentAction = { type: "turn" };

/** Where the manual says the dial must point for these LEDs, or null when it does not list them. */
export function dialAlignmentDirection(rules: DialAlignmentRules, leds: readonly boolean[]): DialAlignmentDirection | null {
  const pattern = rules.patterns.find(
    (p) => p.leds.length === leds.length && p.leds.every((lit, i) => lit === leds[i]),
  );
  return pattern ? pattern.direction : null;
}

export function dialAlignmentTurn(dial: DialAlignmentDirection): DialAlignmentDirection {
  const next = (DIAL_ALIGNMENT_DIRECTIONS.indexOf(dial) + 1) % DIAL_ALIGNMENT_DIRECTIONS.length;
  return DIAL_ALIGNMENT_DIRECTIONS[next] as DialAlignmentDirection;
}

function sleep(state: DialAlignmentState, fromMs: number): DialAlignmentState {
  const napMs = createRng(state.key).fork(String(state.cycle)).fork("nap").int(15_000, 30_000);
  return { kind: "asleep", dial: state.dial, key: state.key, cycle: state.cycle + 1, wakeAtMs: fromMs + napMs };
}

function propose(rng: Rng): DialAlignmentRules {
  // Every direction appears twice, so no dial position is a safe guess.
  const directions = rng.shuffle([...DIAL_ALIGNMENT_DIRECTIONS, ...DIAL_ALIGNMENT_DIRECTIONS]);
  return {
    patterns: directions.map((direction) => {
      const lit = new Set(
        rng.sample(
          Array.from({ length: DIAL_ALIGNMENT_LED_COUNT }, (_, i) => i),
          rng.int(4, 8),
        ),
      );
      return { leds: Array.from({ length: DIAL_ALIGNMENT_LED_COUNT }, (_, i) => lit.has(i)), direction };
    }),
  };
}

function allDistinct(rules: DialAlignmentRules): boolean {
  const seen = new Set(rules.patterns.map((p) => p.leds.map((lit) => (lit ? "1" : "0")).join("")));
  return seen.size === rules.patterns.length;
}

export const dialAlignment: ModuleDef<"dial-alignment", DialAlignmentState, DialAlignmentAction, DialAlignmentRules> = {
  id: "dial-alignment",
  name: "Dial Alignment",
  kind: "needy",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => allDistinct(rules) && checkModuleSolvable(dialAlignment, rules, { samples: 200 }).ok,
    );
  },

  generate(rng) {
    return {
      kind: "asleep",
      dial: rng.pick(DIAL_ALIGNMENT_DIRECTIONS),
      key: rng.key,
      cycle: 0,
      wakeAtMs: rng.int(20_000, 45_000),
    };
  },

  apply(state) {
    if (state.kind !== "active") return { state };
    return { state: { ...state, dial: dialAlignmentTurn(state.dial) } };
  },

  nextEventAt(state) {
    return state.kind === "asleep" ? state.wakeAtMs : state.deadlineMs;
  },

  tick(state, ctx) {
    if (state.kind === "active") {
      const next = sleep(state, state.deadlineMs);
      return dialAlignmentDirection(ctx.rules, state.leds) === state.dial ? { state: next } : { state: next, strike: true };
    }
    if (ctx.rules.patterns.length === 0) return { state: sleep(state, state.wakeAtMs) };
    const pattern = createRng(state.key).fork(String(state.cycle)).fork("pattern").pick(ctx.rules.patterns);
    return {
      state: {
        kind: "active",
        dial: state.dial,
        key: state.key,
        cycle: state.cycle,
        leds: [...pattern.leds],
        // Counted from the scheduled wake time, so a late tick never lengthens the window.
        deadlineMs: state.wakeAtMs + DIAL_ALIGNMENT_WINDOW_MS,
      },
    };
  },

  hint(state, ctx) {
    if (state.kind !== "active") return null;
    const direction = dialAlignmentDirection(ctx.rules, state.leds);
    return direction === null || direction === state.dial ? null : { type: "turn" };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "turn") return null;
    return { type: "turn" };
  },
};
