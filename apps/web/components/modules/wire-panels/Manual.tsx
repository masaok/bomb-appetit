import {
  WIRE_PANELS_COLORS,
  WIRE_PANELS_MAX_OCCURRENCE,
  type WirePanelsLetter,
  type WirePanelsRules,
} from "@bombappetit/engine/modules/wire-panels";
import {
  ColorWord,
  ManualLead,
  ManualSubheading,
  ManualTable,
  RuleList,
} from "@/components/manual/primitives";
import { GAME_COLORS } from "../colors";
import type { ModuleManualProps } from "../types";

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

function letters(list: WirePanelsLetter[] | undefined): string {
  return list && list.length > 0 ? list.join(" or ") : "never";
}

export function Manual({ rules }: ModuleManualProps<WirePanelsRules>) {
  return (
    <>
      <ManualLead>
        Four panels, shown one at a time. Each panel has up to three wires. A wire runs from a numbered post
        on the left to a lettered post on the right. Each wire is red, blue or black. Earlier panels cannot be
        seen again.
      </ManualLead>
      <RuleList>
        <li>Read the wires of a panel from post 1 down to post 3.</li>
        <li>Keep a separate count for each color. The counts carry on from panel to panel.</li>
        <li>Count every wire, whether or not it gets cut.</li>
        <li>
          Find the wire&apos;s color and count in the table. Cut the wire only if it ends at a listed letter.
        </li>
        <li>When every wire on the panel has been checked, press the next panel button.</li>
        <li>Pressing the button on the fourth panel finishes the module.</li>
      </RuleList>

      <section className="break-inside-avoid">
        <ManualSubheading>Cut the wire if it ends at</ManualSubheading>
        <ManualTable
          head={[
            "Count",
            ...WIRE_PANELS_COLORS.map((color) => (
              <ColorWord key={color} name={GAME_COLORS[color].name} hex={GAME_COLORS[color].hex} />
            )),
          ]}
          rows={Array.from({ length: WIRE_PANELS_MAX_OCCURRENCE }, (_, n) => [
            <strong key="n">{ORDINALS[n]}</strong>,
            ...WIRE_PANELS_COLORS.map((color) => letters(rules.tables[color][n])),
          ])}
        />
      </section>
    </>
  );
}
