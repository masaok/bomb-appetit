import { createRng, type Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isRecord, type ModuleDef } from "../../types";

export const PRESSURE_VENT_ANSWER_MS = 40_000;
export const PRESSURE_VENT_PROMPT_COUNT = 6;

export const PRESSURE_VENT_PROMPTS = [
  "Is the souffle ticking?",
  "Salt the fuse?",
  "Vent the gravy?",
  "Is the kettle armed?",
  "Simmer the sparks?",
  "Garnish with gunpowder?",
  "Is dinner about to blow?",
  "Preheat the detonator?",
  "Whisk the wick?",
  "Is the lid rattling?",
] as const;

export interface PressureVentPrompt {
  text: string;
  yes: boolean;
}

export interface PressureVentRules {
  prompts: PressureVentPrompt[];
}

interface Cycle {
  /** Key of the instance's rng, kept so each cycle can draw fresh values. */
  key: string;
  cycle: number;
}

export type PressureVentState =
  | (Cycle & { kind: "asleep"; wakeAtMs: number })
  | (Cycle & { kind: "active"; prompt: string; deadlineMs: number });

export type PressureVentAction = { type: "answer"; yes: boolean };

/** The manual's answer for a prompt, or null when the manual does not list it. */
export function pressureVentAnswer(rules: PressureVentRules, prompt: string): boolean | null {
  return rules.prompts.find((p) => p.text === prompt)?.yes ?? null;
}

function sleep(state: PressureVentState, fromMs: number): PressureVentState {
  const napMs = createRng(state.key).fork(String(state.cycle)).fork("nap").int(15_000, 30_000);
  return { kind: "asleep", key: state.key, cycle: state.cycle + 1, wakeAtMs: fromMs + napMs };
}

function propose(rng: Rng): PressureVentRules {
  return {
    prompts: rng
      .sample(PRESSURE_VENT_PROMPTS, PRESSURE_VENT_PROMPT_COUNT)
      .map((text) => ({ text, yes: rng.bool() })),
  };
}

/** A manual that answers nearly everything the same way needs no Expert. */
function isMixed(rules: PressureVentRules): boolean {
  const yes = rules.prompts.filter((p) => p.yes).length;
  return yes >= 2 && rules.prompts.length - yes >= 2;
}

export const pressureVent: ModuleDef<"pressure-vent", PressureVentState, PressureVentAction, PressureVentRules> = {
  id: "pressure-vent",
  name: "Pressure Vent",
  kind: "needy",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => isMixed(rules) && checkModuleSolvable(pressureVent, rules, { samples: 200 }).ok,
    );
  },

  generate(rng) {
    return { kind: "asleep", key: rng.key, cycle: 0, wakeAtMs: rng.int(20_000, 45_000) };
  },

  apply(state, action, ctx) {
    if (state.kind !== "active") return { state };
    const next = sleep(state, ctx.elapsedMs);
    return pressureVentAnswer(ctx.rules, state.prompt) === action.yes ? { state: next } : { state: next, strike: true };
  },

  nextEventAt(state) {
    return state.kind === "asleep" ? state.wakeAtMs : state.deadlineMs;
  },

  tick(state, ctx) {
    if (state.kind === "active") return { state: sleep(state, state.deadlineMs), strike: true };
    if (ctx.rules.prompts.length === 0) return { state: sleep(state, state.wakeAtMs) };
    const prompt = createRng(state.key).fork(String(state.cycle)).fork("prompt").pick(ctx.rules.prompts);
    return {
      state: {
        kind: "active",
        key: state.key,
        cycle: state.cycle,
        prompt: prompt.text,
        // Counted from the scheduled wake time, so a late tick never lengthens the window.
        deadlineMs: state.wakeAtMs + PRESSURE_VENT_ANSWER_MS,
      },
    };
  },

  hint(state, ctx) {
    if (state.kind !== "active") return null;
    const yes = pressureVentAnswer(ctx.rules, state.prompt);
    return yes === null ? null : { type: "answer", yes };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "answer" || typeof raw.yes !== "boolean") return null;
    return { type: "answer", yes: raw.yes };
  },
};
