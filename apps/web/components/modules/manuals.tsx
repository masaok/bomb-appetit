import type { ModuleId, RuleBook } from "@bombappetit/engine";
import type { ComponentType } from "react";
import type { ManualProps, ModuleManualProps } from "./types";
import { Manual as BigButton } from "./big-button/Manual";
import { Manual as Blinker } from "./blinker/Manual";
import { Manual as ColorEcho } from "./color-echo/Manual";
import { Manual as DialAlignment } from "./dial-alignment/Manual";
import { Manual as DischargeLever } from "./discharge-lever/Manual";
import { Manual as GlyphKeypad } from "./glyph-keypad/Manual";
import { Manual as Labyrinth } from "./labyrinth/Manual";
import { Manual as Passcode } from "./passcode/Manual";
import { Manual as PressureVent } from "./pressure-vent/Manual";
import { Manual as Recall } from "./recall/Manual";
import { Manual as TangledWires } from "./tangled-wires/Manual";
import { Manual as WirePanels } from "./wire-panels/Manual";
import { Manual as Wires } from "./wires/Manual";
import { Manual as WordGrid } from "./word-grid/Manual";

/** The Experts' view of every module. The mapped type fails the build if one is missing. */
export const MANUALS: { [K in ModuleId]: ComponentType<ManualProps<K>> } = {
  wires: Wires,
  "big-button": BigButton,
  "glyph-keypad": GlyphKeypad,
  "color-echo": ColorEcho,
  "word-grid": WordGrid,
  recall: Recall,
  blinker: Blinker,
  "tangled-wires": TangledWires,
  "wire-panels": WirePanels,
  labyrinth: Labyrinth,
  passcode: Passcode,
  "pressure-vent": PressureVent,
  "discharge-lever": DischargeLever,
  "dial-alignment": DialAlignment,
};

export function ModuleManual({ id, book }: { id: ModuleId; book: RuleBook }) {
  // `id` picks the manual written for exactly this rule type.
  const Manual = MANUALS[id] as ComponentType<ModuleManualProps<unknown>>;
  return <Manual rules={book[id]} />;
}
