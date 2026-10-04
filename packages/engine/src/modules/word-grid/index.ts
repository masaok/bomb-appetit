import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleDef } from "../../types";

/** Kitchen words chosen because each has a sound-alike that is spelled differently. */
export const WORD_GRID_DISPLAY_WORDS = [
  "FLOUR",
  "FLOWER",
  "THYME",
  "TIME",
  "MEAT",
  "MEET",
  "STEAK",
  "STAKE",
  "PEAR",
  "PAIR",
  "PARE",
  "BREAD",
  "BRED",
  "DOUGH",
  "DOH",
  "ROLL",
  "ROLE",
  "LEEK",
  "LEAK",
  "MOUSSE",
  "MOOSE",
  "CHILI",
  "CHILLY",
  "WHISK",
] as const;

/** Words that sound like talk between players, so reading them aloud causes confusion. */
export const WORD_GRID_BUTTON_WORDS = [
  "WAIT",
  "WEIGHT",
  "WHAT",
  "WATT",
  "RIGHT",
  "WRITE",
  "RITE",
  "NOT",
  "KNOT",
  "NOW",
  "KNOW",
  "WHICH",
  "WITCH",
  "HANG ON",
  "HMM",
  "HUH",
  "UH OH",
  "OH",
  "OWE",
  "GO ON",
  "GOT IT",
  "AGAIN",
  "SAY AGAIN",
  "STOP",
] as const;

/** Button positions in reading order: two columns, three rows. */
export const WORD_GRID_POSITIONS = [
  "top left",
  "top right",
  "middle left",
  "middle right",
  "bottom left",
  "bottom right",
] as const;

export const WORD_GRID_STAGE_COUNT = 3;
export const WORD_GRID_PRIORITY_LENGTH = 10;

export interface WordGridRead {
  display: string;
  /** Index into `WORD_GRID_POSITIONS` of the button to read. */
  position: number;
}

export interface WordGridPriority {
  word: string;
  /** Press the first of these that is on the grid. Always contains `word` itself. */
  order: string[];
}

export interface WordGridRules {
  read: WordGridRead[];
  priority: WordGridPriority[];
}

export interface WordGridStage {
  display: string;
  /** Six different button words, in `WORD_GRID_POSITIONS` order. */
  buttons: string[];
}

export interface WordGridState {
  stages: WordGridStage[];
  /** Index of the stage being played; equals `stages.length` once solved. */
  stage: number;
}

export type WordGridAction = { type: "press"; position: number };

/** Position the manual says to press for this stage, or -1 when the rules do not cover it. */
export function wordGridPositionToPress(rules: WordGridRules, stage: WordGridStage): number {
  const read = rules.read.find((r) => r.display === stage.display);
  if (!read) return -1;
  const readWord = stage.buttons[read.position];
  const priority = rules.priority.find((p) => p.word === readWord);
  if (!priority) return -1;
  const press = priority.order.find((word) => stage.buttons.includes(word));
  return press === undefined ? -1 : stage.buttons.indexOf(press);
}

function propose(rng: Rng): WordGridRules {
  return {
    read: WORD_GRID_DISPLAY_WORDS.map((display) => ({
      display,
      position: rng.int(0, WORD_GRID_POSITIONS.length - 1),
    })),
    priority: WORD_GRID_BUTTON_WORDS.map((word) => {
      const others = WORD_GRID_BUTTON_WORDS.filter((w) => w !== word);
      return { word, order: rng.shuffle([word, ...rng.sample(others, WORD_GRID_PRIORITY_LENGTH - 1)]) };
    }),
  };
}

/** Rejects manuals that never send the Defuser to some position. */
function isInteresting(rules: WordGridRules): boolean {
  return new Set(rules.read.map((r) => r.position)).size === WORD_GRID_POSITIONS.length;
}

export const wordGrid: ModuleDef<"word-grid", WordGridState, WordGridAction, WordGridRules> = {
  id: "word-grid",
  name: "Word Grid",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) => isInteresting(rules) && checkModuleSolvable(wordGrid, rules).ok,
    );
  },

  generate(rng) {
    const displays = rng.sample(WORD_GRID_DISPLAY_WORDS, WORD_GRID_STAGE_COUNT);
    return {
      stages: displays.map((display) => ({
        display,
        buttons: rng.sample(WORD_GRID_BUTTON_WORDS, WORD_GRID_POSITIONS.length),
      })),
      stage: 0,
    };
  },

  apply(state, action, ctx) {
    const stage = state.stages[state.stage];
    if (!stage || action.position >= stage.buttons.length) return { state };
    if (action.position !== wordGridPositionToPress(ctx.rules, stage)) return { state, strike: true };
    const next = { ...state, stage: state.stage + 1 };
    return next.stage >= state.stages.length ? { state: next, solved: true } : { state: next };
  },

  hint(state, ctx) {
    const stage = state.stages[state.stage];
    if (!stage) return null;
    const position = wordGridPositionToPress(ctx.rules, stage);
    return position < 0 ? null : { type: "press", position };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "press" || !isInt(raw.position, 0, 5)) return null;
    return { type: "press", position: raw.position };
  },
};
