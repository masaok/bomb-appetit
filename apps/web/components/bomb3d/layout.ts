import { CASE_SIZES, type CaseSize } from "@bombappetit/engine";

/** World units. One slot is one unit square. */
export const SLOT = 1;
export const GAP = 0.1;
export const MARGIN = 0.3;
export const DEPTH = 1.4;

/** DOM pixels per world unit inside the Html planes: a 320 px slot leaves ModuleFrame its native 300 px box. */
export const PX_PER_UNIT = 320;
/** drei's Html maps 40 px to one world unit by default. */
export const HTML_SCALE = 40 / PX_PER_UNIT;

export const FOV = 35;

export interface CaseLayout {
  cols: number;
  rows: number;
  perFace: number;
  width: number;
  height: number;
}

export function caseLayout(caseSize: CaseSize): CaseLayout {
  const { cols, rows } = CASE_SIZES[caseSize];
  return {
    cols,
    rows,
    perFace: cols * rows,
    width: cols * SLOT + (cols - 1) * GAP + 2 * MARGIN,
    height: rows * SLOT + (rows - 1) * GAP + 2 * MARGIN,
  };
}

export type FaceName = "front" | "back";

/** Where a slot sits on its own face, in that face's coordinates (x to the viewer's right, y up). */
export function slotPlace(layout: CaseLayout, slotIndex: number): { face: FaceName; x: number; y: number } {
  const onFace = slotIndex % layout.perFace;
  const col = onFace % layout.cols;
  const row = Math.floor(onFace / layout.cols);
  const pitch = SLOT + GAP;
  return {
    face: slotIndex < layout.perFace ? "front" : "back",
    x: (col - (layout.cols - 1) / 2) * pitch,
    y: ((layout.rows - 1) / 2 - row) * pitch,
  };
}

const halfTan = Math.tan((FOV * Math.PI) / 360);

/** Camera distance from the bomb's centre at which a w x h rectangle on the near face fills the view. */
function fitDistance(w: number, h: number, aspect: number): number {
  return Math.max(h / 2 / halfTan, w / 2 / (halfTan * aspect)) + DEPTH / 2;
}

export function overviewDistance(layout: CaseLayout, aspect: number): number {
  // Extra room for the bumpers, the handle and the corners swinging out while rotating.
  return fitDistance(layout.width + 1, layout.height + 1.1, aspect);
}

export function focusDistance(aspect: number): number {
  const padded = SLOT / 0.84;
  return fitDistance(padded, padded, aspect);
}
