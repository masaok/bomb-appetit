import {
  COLOR_ECHO_COLORS,
  type ColorEchoColor,
  type ColorEchoRules,
  type ColorEchoStrikeTables,
} from "@bombappetit/engine/modules/color-echo";
import { ColorWord, ManualLead, ManualSubheading, ManualTable } from "@/components/manual/primitives";
import { GAME_COLORS } from "../colors";
import type { ModuleManualProps } from "../types";

function Color({ color }: { color: ColorEchoColor }) {
  return <ColorWord name={GAME_COLORS[color].name} hex={GAME_COLORS[color].hex} />;
}

function StrikeTables({ title, tables }: { title: string; tables: ColorEchoStrikeTables }) {
  return (
    <section className="break-inside-avoid">
      <ManualSubheading>{title}</ManualSubheading>
      <ManualTable
        head={["Pad that flashes", "No strikes: press", "One strike: press", "Two or more strikes: press"]}
        rows={COLOR_ECHO_COLORS.map((flashed) => [
          <Color key="flashed" color={flashed} />,
          ...tables.map((table, i) => <Color key={i} color={table[flashed]} />),
        ])}
      />
    </section>
  );
}

export function Manual({ rules }: ModuleManualProps<ColorEchoRules>) {
  return (
    <>
      <ManualLead>
        Four pads: red, blue, green and yellow. The pads flash a sequence, pause, and repeat it.
        Do not press the pad that flashes. For each flash, look up the pad to press in the table.
        Press them in the same order as the flashes. Each time you get it right, the sequence
        grows by one flash. Answer the whole longer sequence from its start.
      </ManualLead>
      <ManualLead>
        Pick the table by the serial number. Pick the column by the number of strikes on the bomb
        right now. A wrong press is a strike. Then start the current sequence again, using the new
        column.
      </ManualLead>
      <StrikeTables title="The serial number has a vowel" tables={rules.vowel} />
      <StrikeTables title="The serial number has no vowel" tables={rules.noVowel} />
    </>
  );
}
