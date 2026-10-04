import type { GlyphKeypadGlyph, GlyphKeypadMark, GlyphKeypadShape } from "@bombappetit/engine/modules/glyph-keypad";
import type { ReactNode } from "react";

/** Where the inner mark sits, and how much room the shape leaves for it. */
const SHAPES: Record<GlyphKeypadShape, { outline: ReactNode; cx: number; cy: number; scale: number }> = {
  circle: { outline: <circle cx="24" cy="24" r="20" />, cx: 24, cy: 24, scale: 1 },
  square: { outline: <rect x="5" y="5" width="38" height="38" rx="3" />, cx: 24, cy: 24, scale: 1 },
  triangle: { outline: <path d="M24 4L46 43H2Z" />, cx: 24, cy: 31, scale: 0.72 },
  diamond: { outline: <path d="M24 2L46 24L24 46L2 24Z" />, cx: 24, cy: 24, scale: 0.85 },
  hexagon: { outline: <path d="M13 5H35L46 24L35 43H13L2 24Z" />, cx: 24, cy: 24, scale: 1 },
  arch: { outline: <path d="M6 44V23A18 18 0 0 1 42 23V44Z" />, cx: 24, cy: 27, scale: 1 },
};

const MARKS: Record<GlyphKeypadMark, ReactNode> = {
  // a near zero-length stroke with round caps draws a solid dot without using fill
  dot: <path d="M0 0h0.01" strokeWidth="9" />,
  bar: <path d="M-10 0H10" />,
  plus: <path d="M-9 0H9M0 -9V9" />,
  ring: <circle cx="0" cy="0" r="7" />,
  zigzag: <path d="M-11 5L-4 -5L4 5L11 -5" />,
};

export function glyphName(id: GlyphKeypadGlyph): string {
  return id.replace("-", " ");
}

/** One keypad glyph: an outer shape with a mark inside. Stroke only, so it prints in black and white. */
export function Glyph({ id, className }: { id: GlyphKeypadGlyph; className?: string }) {
  const [shapeName, markName] = id.split("-") as [GlyphKeypadShape, GlyphKeypadMark];
  const shape = SHAPES[shapeName];
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={glyphName(id)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shape.outline}
      <g transform={`translate(${shape.cx} ${shape.cy}) scale(${shape.scale})`}>{MARKS[markName]}</g>
    </svg>
  );
}
