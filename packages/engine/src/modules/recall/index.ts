import { createRng, type Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleDef } from "../../types";

export const RECALL_STAGE_COUNT = 5;
export const RECALL_DIGITS = [1, 2, 3, 4] as const;

/** Positions are 0-based from the left; labels are the digits 1 to 4; `stage` is a 0-based earlier stage. */
export type RecallInstruction =
  | { kind: "position"; position: number }
  | { kind: "label"; label: number }
  | { kind: "samePosition"; stage: number }
  | { kind: "sameLabel"; stage: number };

export interface RecallRules {
  /** `stages[stage][display - 1]` is what to do at that stage for that display digit. */
  stages: RecallInstruction[][];
}

export interface RecallStage {
  display: number;
  /** The digit printed on each button, left to right. Always a permutation of 1 to 4. */
  labels: number[];
}

export interface RecallPress {
  position: number;
  label: number;
}

export interface RecallState {
  /** Key of the instance rng, so replacement content after a strike can be re-derived. */
  key: string;
  resets: number;
  stages: RecallStage[];
  /** One entry per completed stage; its length is the index of the stage being played. */
  history: RecallPress[];
}

export type RecallAction = { type: "press"; position: number };

/** Position the manual says to press right now, or -1 when the rules do not cover it. */
export function recallPositionToPress(rules: RecallRules, state: RecallState): number {
  const stage = state.stages[state.history.length];
  if (!stage) return -1;
  const instruction = rules.stages[state.history.length]?.[stage.display - 1];
  if (!instruction) return -1;
  switch (instruction.kind) {
    case "position":
      return instruction.position < stage.labels.length ? instruction.position : -1;
    case "label":
      return stage.labels.indexOf(instruction.label);
    case "samePosition":
      return state.history[instruction.stage]?.position ?? -1;
    case "sameLabel": {
      const earlier = state.history[instruction.stage];
      return earlier ? stage.labels.indexOf(earlier.label) : -1;
    }
  }
}

function content(key: string, resets: number): RecallStage[] {
  const rng = createRng(key).fork(String(resets));
  return Array.from({ length: RECALL_STAGE_COUNT }, () => ({
    display: rng.pick(RECALL_DIGITS),
    labels: rng.shuffle(RECALL_DIGITS),
  }));
}

function proposeInstruction(rng: Rng, stage: number): RecallInstruction {
  if (stage > 0 && rng.bool(0.6)) {
    return { kind: rng.pick(["samePosition", "sameLabel"] as const), stage: rng.int(0, stage - 1) };
  }
  return rng.bool()
    ? { kind: "position", position: rng.int(0, RECALL_DIGITS.length - 1) }
    : { kind: "label", label: rng.pick(RECALL_DIGITS) };
}

function propose(rng: Rng): RecallRules {
  return {
    stages: Array.from({ length: RECALL_STAGE_COUNT }, (_, stage) =>
      RECALL_DIGITS.map(() => proposeInstruction(rng, stage)),
    ),
  };
}

/** Rejects manuals where a stage gives the same instruction for every display, or never looks back. */
function isInteresting(rules: RecallRules): boolean {
  return rules.stages.every((row, stage) => {
    const distinct = new Set(row.map((i) => JSON.stringify(i))).size;
    const lookBack = row.some((i) => i.kind === "samePosition" || i.kind === "sameLabel");
    return distinct >= 3 && (stage === 0 || lookBack);
  });
}

export const recall: ModuleDef<"recall", RecallState, RecallAction, RecallRules> = {
  id: "recall",
  name: "Recall",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => isInteresting(rules) && checkModuleSolvable(recall, rules).ok,
    );
  },

  generate(rng) {
    return { key: rng.key, resets: 0, stages: content(rng.key, 0), history: [] };
  },

  apply(state, action, ctx) {
    const stage = state.stages[state.history.length];
    const label = stage?.labels[action.position];
    if (!stage || label === undefined) return { state };
    if (action.position !== recallPositionToPress(ctx.rules, state)) {
      const resets = state.resets + 1;
      return { state: { key: state.key, resets, stages: content(state.key, resets), history: [] }, strike: true };
    }
    const next = { ...state, history: [...state.history, { position: action.position, label }] };
    return next.history.length >= state.stages.length ? { state: next, solved: true } : { state: next };
  },

  hint(state, ctx) {
    const position = recallPositionToPress(ctx.rules, state);
    return position < 0 ? null : { type: "press", position };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "press" || !isInt(raw.position, 0, 3)) return null;
    return { type: "press", position: raw.position };
  },
};
