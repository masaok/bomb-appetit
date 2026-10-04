import type { GlyphKeypadRules } from "@bombappetit/engine/modules/glyph-keypad";
import { ManualLead, ManualTable } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";
import { Glyph, glyphName } from "./glyphs";

export function Manual({ rules }: ModuleManualProps<GlyphKeypadRules>) {
  const depth = Math.max(0, ...rules.columns.map((column) => column.length));
  return (
    <>
      <ManualLead>
        Four keys, each with a glyph. A glyph is an outer shape with a mark inside, such as a
        circle with a dot. Only one column below has all four glyphs. Find that column. Press the
        four keys in the order their glyphs appear in that column, from top to bottom.
      </ManualLead>
      <ManualTable
        head={rules.columns.map((_, i) => `Column ${i + 1}`)}
        rows={Array.from({ length: depth }, (_, row) =>
          rules.columns.map((column, c) => {
            const glyph = column[row];
            return glyph ? (
              <span key={c} className="flex flex-col items-center gap-1 text-center text-xs leading-tight">
                <Glyph id={glyph} className="size-10" />
                {glyphName(glyph)}
              </span>
            ) : null;
          }),
        )}
      />
    </>
  );
}
