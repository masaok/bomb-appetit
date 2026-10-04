// Written by `pnpm rules:freeze`. Do not edit by hand; edit the JSON files instead.
import type { RuleBook } from "../../modules/registry";
import wires from "./wires.json";
import bigButton from "./big-button.json";
import glyphKeypad from "./glyph-keypad.json";
import colorEcho from "./color-echo.json";
import wordGrid from "./word-grid.json";
import recall from "./recall.json";
import blinker from "./blinker.json";
import tangledWires from "./tangled-wires.json";
import wirePanels from "./wire-panels.json";
import labyrinth from "./labyrinth.json";
import passcode from "./passcode.json";
import pressureVent from "./pressure-vent.json";
import dischargeLever from "./discharge-lever.json";
import dialAlignment from "./dial-alignment.json";

// JSON imports lose literal types (a color becomes `string`), so the compiler cannot
// check these files against RuleBook. test/rules.test.ts does: it requires every frozen
// file to equal what its generator produces for seed 1 at the frozen engine version.
export const FROZEN_RULES = {
  "wires": wires,
  "big-button": bigButton,
  "glyph-keypad": glyphKeypad,
  "color-echo": colorEcho,
  "word-grid": wordGrid,
  "recall": recall,
  "blinker": blinker,
  "tangled-wires": tangledWires,
  "wire-panels": wirePanels,
  "labyrinth": labyrinth,
  "passcode": passcode,
  "pressure-vent": pressureVent,
  "discharge-lever": dischargeLever,
  "dial-alignment": dialAlignment,
} as unknown as Partial<RuleBook>;
