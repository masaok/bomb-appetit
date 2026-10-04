import {
  batteryCount,
  hasIndicator,
  INDICATOR_LABELS,
  type Edgework,
  type IndicatorLabel,
} from "../../edgework";
import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isRecord, type ModuleDef } from "../../types";

export const BIG_BUTTON_COLORS = ["red", "blue", "yellow", "white", "green"] as const;
export type BigButtonColor = (typeof BIG_BUTTON_COLORS)[number];

export const BIG_BUTTON_LABELS = ["BOOP", "NOPE", "ZING", "HUSH", "CHOMP"] as const;
export type BigButtonLabel = (typeof BIG_BUTTON_LABELS)[number];

/** A release sooner than this after the press is a tap. At or after it, a hold. */
export const BIG_BUTTON_TAP_MS = 500;

export type BigButtonMove = "tap" | "hold";

export type BigButtonCondition =
  | { kind: "color"; color: BigButtonColor }
  | { kind: "label"; label: BigButtonLabel }
  | { kind: "batteries"; cmp: "moreThan" | "fewerThan"; n: number }
  | { kind: "litIndicator"; label: IndicatorLabel };

export interface BigButtonRule {
  /** Every condition must hold. */
  when: BigButtonCondition[];
  then: BigButtonMove;
}

export interface BigButtonRules {
  /** Read top to bottom; the first rule whose conditions all hold wins. */
  rules: BigButtonRule[];
  otherwise: BigButtonMove;
  /** While holding, release when the countdown display contains this digit. */
  stripDigits: Record<BigButtonColor, number>;
}

export interface BigButtonState {
  color: BigButtonColor;
  label: BigButtonLabel;
  /** The strip only lights while the button is held. */
  strip: BigButtonColor;
  press: { kind: "idle" } | { kind: "held"; sinceMs: number };
}

export type BigButtonAction = { type: "press" } | { type: "release" };

function holds(
  condition: BigButtonCondition,
  button: Pick<BigButtonState, "color" | "label">,
  edgework: Edgework,
): boolean {
  switch (condition.kind) {
    case "color":
      return button.color === condition.color;
    case "label":
      return button.label === condition.label;
    case "batteries": {
      const count = batteryCount(edgework);
      return condition.cmp === "moreThan" ? count > condition.n : count < condition.n;
    }
    case "litIndicator":
      return hasIndicator(edgework, condition.label, true);
  }
}

/** Whether the manual says to tap or to hold this button on this bomb. */
export function bigButtonMove(
  rules: BigButtonRules,
  button: Pick<BigButtonState, "color" | "label">,
  edgework: Edgework,
): BigButtonMove {
  const rule = rules.rules.find((r) => r.when.every((c) => holds(c, button, edgework)));
  return rule ? rule.then : rules.otherwise;
}

/** Whether the countdown display currently allows releasing a held button. */
export function bigButtonCanRelease(
  rules: BigButtonRules,
  strip: BigButtonColor,
  timerText: string,
): boolean {
  return timerText.includes(String(rules.stripDigits[strip]));
}

const CONDITION_KINDS = ["color", "label", "batteries", "litIndicator"] as const;

function proposeCondition(rng: Rng, kind: BigButtonCondition["kind"]): BigButtonCondition {
  switch (kind) {
    case "color":
      return { kind, color: rng.pick(BIG_BUTTON_COLORS) };
    case "label":
      return { kind, label: rng.pick(BIG_BUTTON_LABELS) };
    case "batteries":
      return rng.bool()
        ? { kind, cmp: "moreThan", n: rng.int(1, 3) }
        : { kind, cmp: "fewerThan", n: rng.int(2, 3) };
    case "litIndicator":
      return { kind, label: rng.pick(INDICATOR_LABELS) };
  }
}

function propose(rng: Rng): BigButtonRules {
  const rules: BigButtonRule[] = [];
  for (let i = 0, n = rng.int(4, 5); i < n; i++) {
    // Distinct kinds, so one rule never asks for two colors or two labels at once.
    const kinds = rng.sample(CONDITION_KINDS, rng.bool(0.35) ? 2 : 1);
    rules.push({
      when: kinds.map((kind) => proposeCondition(rng, kind)),
      then: rng.pick(["tap", "hold"] as const),
    });
  }
  const digits = rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], BIG_BUTTON_COLORS.length);
  const stripDigits = { red: 0, blue: 0, yellow: 0, white: 0, green: 0 };
  BIG_BUTTON_COLORS.forEach((color, i) => {
    stripDigits[color] = digits[i] as number;
  });
  return { rules, otherwise: rng.pick(["tap", "hold"] as const), stripDigits };
}

/** Rejects manuals with a repeated or pointless line, or where every line gives the same answer. */
function isInteresting(rules: BigButtonRules): boolean {
  const moves = new Set([...rules.rules.map((r) => r.then), rules.otherwise]);
  const conditions = rules.rules.map((r) => JSON.stringify(r.when));
  const last = rules.rules[rules.rules.length - 1];
  return moves.size === 2 && new Set(conditions).size === conditions.length && last?.then !== rules.otherwise;
}

export const bigButton: ModuleDef<"big-button", BigButtonState, BigButtonAction, BigButtonRules> = {
  id: "big-button",
  name: "Big Button",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => isInteresting(rules) && checkModuleSolvable(bigButton, rules).ok,
    );
  },

  generate(rng) {
    return {
      color: rng.pick(BIG_BUTTON_COLORS),
      label: rng.pick(BIG_BUTTON_LABELS),
      strip: rng.pick(BIG_BUTTON_COLORS),
      press: { kind: "idle" },
    };
  },

  apply(state, action, ctx) {
    if (action.type === "press") {
      if (state.press.kind === "held") return { state };
      return { state: { ...state, press: { kind: "held", sinceMs: ctx.elapsedMs } } };
    }
    if (state.press.kind === "idle") return { state };

    const idle: BigButtonState = { ...state, press: { kind: "idle" } };
    const tapped = ctx.elapsedMs - state.press.sinceMs < BIG_BUTTON_TAP_MS;
    const correct =
      bigButtonMove(ctx.rules, state, ctx.edgework) === "tap"
        ? tapped
        : !tapped && bigButtonCanRelease(ctx.rules, state.strip, ctx.timerText);
    return correct ? { state: idle, solved: true } : { state: idle, strike: true };
  },

  hint(state, ctx) {
    if (state.press.kind === "idle") return { type: "press" };
    if (bigButtonMove(ctx.rules, state, ctx.edgework) === "tap") return { type: "release" };
    const heldLongEnough = ctx.elapsedMs - state.press.sinceMs >= BIG_BUTTON_TAP_MS;
    return heldLongEnough && bigButtonCanRelease(ctx.rules, state.strip, ctx.timerText)
      ? { type: "release" }
      : null;
  },

  parseAction(raw) {
    if (!isRecord(raw)) return null;
    if (raw.type === "press") return { type: "press" };
    if (raw.type === "release") return { type: "release" };
    return null;
  },
};
