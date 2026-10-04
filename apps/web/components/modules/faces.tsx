"use client";

import type { ModuleId, ModuleInstance } from "@bombappetit/engine";
import type { ComponentType } from "react";
import type { BombReadout, FaceProps, ModuleFaceProps } from "./types";
import { Face as BigButton } from "./big-button/Face";
import { Face as Blinker } from "./blinker/Face";
import { Face as ColorEcho } from "./color-echo/Face";
import { Face as DialAlignment } from "./dial-alignment/Face";
import { Face as DischargeLever } from "./discharge-lever/Face";
import { Face as GlyphKeypad } from "./glyph-keypad/Face";
import { Face as Labyrinth } from "./labyrinth/Face";
import { Face as Passcode } from "./passcode/Face";
import { Face as PressureVent } from "./pressure-vent/Face";
import { Face as Recall } from "./recall/Face";
import { Face as TangledWires } from "./tangled-wires/Face";
import { Face as WirePanels } from "./wire-panels/Face";
import { Face as Wires } from "./wires/Face";
import { Face as WordGrid } from "./word-grid/Face";

/** The Defuser's view of every module. The mapped type fails the build if one is missing. */
export const FACES: { [K in ModuleId]: ComponentType<FaceProps<K>> } = {
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

export function ModuleFace({
  instance,
  bomb,
  dispatch,
}: {
  instance: ModuleInstance;
  bomb: BombReadout;
  dispatch: (action: unknown) => void;
}) {
  // `instance.id` picks the face written for exactly this state type.
  const Face = FACES[instance.id] as ComponentType<ModuleFaceProps<unknown, unknown>>;
  return <Face state={instance.state} solved={instance.solved} bomb={bomb} dispatch={dispatch} />;
}
