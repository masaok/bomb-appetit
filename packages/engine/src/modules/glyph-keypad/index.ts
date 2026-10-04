import type { Rng } from "../../rng";
import { checkModuleSolvable, generateSolvableRules } from "../../rules/solvable";
import { isInt, isRecord, type ModuleDef } from "../../types";

export const GLYPH_KEYPAD_SHAPES = ["circle", "square", "triangle", "diamond", "hexagon", "arch"] as const;
export type GlyphKeypadShape = (typeof GLYPH_KEYPAD_SHAPES)[number];

export const GLYPH_KEYPAD_MARKS = ["dot", "bar", "plus", "ring", "zigzag"] as const;
export type GlyphKeypadMark = (typeof GLYPH_KEYPAD_MARKS)[number];

/** An outer shape with a mark inside, for example "circle-dot". */
export type GlyphKeypadGlyph = `${GlyphKeypadShape}-${GlyphKeypadMark}`;

export const GLYPH_KEYPAD_GLYPHS: readonly GlyphKeypadGlyph[] = GLYPH_KEYPAD_SHAPES.flatMap((shape) =>
  GLYPH_KEYPAD_MARKS.map((mark) => `${shape}-${mark}` as const),
);

export const GLYPH_KEYPAD_COLUMN_COUNT = 6;
export const GLYPH_KEYPAD_COLUMN_SIZE = 7;
export const GLYPH_KEYPAD_KEY_COUNT = 4;

export interface GlyphKeypadRules {
  /** Each column lists its glyphs top to bottom. */
  columns: GlyphKeypadGlyph[][];
}

export interface GlyphKeypadState {
  glyphs: GlyphKeypadGlyph[];
  pressed: boolean[];
}

export type GlyphKeypadAction = { type: "press"; position: number };

/**
 * True when any four glyphs taken from one column fit in no other column.
 * Four glyphs of column A all sit in column B exactly when A and B share four
 * or more glyphs, so checking every pair's overlap covers every 4-subset.
 */
export function glyphKeypadColumnsAreDistinct(columns: GlyphKeypadGlyph[][]): boolean {
  return columns.every((a, i) =>
    columns.every((b, j) => i === j || a.filter((g) => b.includes(g)).length < GLYPH_KEYPAD_KEY_COUNT),
  );
}

/** Key positions in the order to press them, or null when the keys do not point at exactly one column. */
export function glyphKeypadOrder(rules: GlyphKeypadRules, glyphs: GlyphKeypadGlyph[]): number[] | null {
  const fits = rules.columns.filter((column) => glyphs.every((g) => column.includes(g)));
  const column = fits[0];
  if (fits.length !== 1 || !column) return null;
  return glyphs.map((_, position) => position).sort((a, b) => column.indexOf(glyphs[a]!) - column.indexOf(glyphs[b]!));
}

function nextPosition(rules: GlyphKeypadRules, state: GlyphKeypadState): number | null {
  const order = glyphKeypadOrder(rules, state.glyphs);
  return order?.find((position) => !state.pressed[position]) ?? null;
}

function propose(rng: Rng): GlyphKeypadRules {
  return {
    columns: Array.from({ length: GLYPH_KEYPAD_COLUMN_COUNT }, () =>
      rng.sample(GLYPH_KEYPAD_GLYPHS, GLYPH_KEYPAD_COLUMN_SIZE),
    ),
  };
}

/** Every column shares glyphs with the others, so one familiar glyph never gives the column away. */
function overlaps(rules: GlyphKeypadRules): boolean {
  return rules.columns.every(
    (column, i) => column.filter((g) => rules.columns.some((other, j) => i !== j && other.includes(g))).length >= 3,
  );
}

export const glyphKeypad: ModuleDef<"glyph-keypad", GlyphKeypadState, GlyphKeypadAction, GlyphKeypadRules> = {
  id: "glyph-keypad",
  name: "Glyph Keypad",
  kind: "regular",

  generateRules(ruleRng) {
    return generateSolvableRules(
      ruleRng,
      propose,
      (rules) =>
        glyphKeypadColumnsAreDistinct(rules.columns) && overlaps(rules) && checkModuleSolvable(glyphKeypad, rules).ok,
    );
  },

  generate(rng, _bomb, rules) {
    const glyphs = rng.sample(rng.pick(rules.columns), GLYPH_KEYPAD_KEY_COUNT);
    return { glyphs, pressed: glyphs.map(() => false) };
  },

  apply(state, action, ctx) {
    if (state.pressed[action.position] !== false) return { state };
    const next = nextPosition(ctx.rules, state);
    if (next === null) return { state };
    if (action.position !== next) return { state, strike: true };
    const pressed = state.pressed.map((p, i) => p || i === action.position);
    return pressed.every(Boolean) ? { state: { ...state, pressed }, solved: true } : { state: { ...state, pressed } };
  },

  hint(state, ctx) {
    const position = nextPosition(ctx.rules, state);
    return position === null ? null : { type: "press", position };
  },

  parseAction(raw) {
    if (!isRecord(raw) || raw.type !== "press" || !isInt(raw.position, 0, GLYPH_KEYPAD_KEY_COUNT - 1)) return null;
    return { type: "press", position: raw.position };
  },
};
