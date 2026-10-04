import type { ModuleDef } from "../types";
import { bigButton } from "./big-button";
import { blinker } from "./blinker";
import { colorEcho } from "./color-echo";
import { dialAlignment } from "./dial-alignment";
import { dischargeLever } from "./discharge-lever";
import { glyphKeypad } from "./glyph-keypad";
import { labyrinth } from "./labyrinth";
import { passcode } from "./passcode";
import { pressureVent } from "./pressure-vent";
import { recall } from "./recall";
import { tangledWires } from "./tangled-wires";
import { wirePanels } from "./wire-panels";
import { wires } from "./wires";
import { wordGrid } from "./word-grid";

/**
 * Every module in the game. Adding a module means adding it here and in the two
 * web registries (`components/modules/faces.tsx` and `manuals.tsx`).
 * Catalog order: regular modules from easiest to hardest, then the needy ones.
 */
export const MODULES = {
  wires,
  "big-button": bigButton,
  "glyph-keypad": glyphKeypad,
  "color-echo": colorEcho,
  "word-grid": wordGrid,
  recall,
  blinker,
  "tangled-wires": tangledWires,
  "wire-panels": wirePanels,
  labyrinth,
  passcode,
  "pressure-vent": pressureVent,
  "discharge-lever": dischargeLever,
  "dial-alignment": dialAlignment,
} as const;

export type ModuleId = keyof typeof MODULES;

type Parts<K extends ModuleId> = (typeof MODULES)[K] extends ModuleDef<string, infer S, infer A, infer R>
  ? { state: S; action: A; rules: R }
  : never;

export type StateOf<K extends ModuleId> = Parts<K>["state"];
export type ActionOf<K extends ModuleId> = Parts<K>["action"];
export type RulesOf<K extends ModuleId> = Parts<K>["rules"];

/** One module's manual rules, for every module: the whole manual as data. */
export type RuleBook = { [K in ModuleId]: RulesOf<K> };

export type ModuleInstance = {
  [K in ModuleId]: { id: K; state: StateOf<K>; solved: boolean; solvedAtMs: number | null };
}[ModuleId];

export type InstanceOf<K extends ModuleId> = Extract<ModuleInstance, { id: K }>;

export const MODULE_IDS = Object.keys(MODULES) as ModuleId[];
export const REGULAR_MODULE_IDS = MODULE_IDS.filter((id) => MODULES[id].kind === "regular");
export const NEEDY_MODULE_IDS = MODULE_IDS.filter((id) => MODULES[id].kind === "needy");

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && Object.hasOwn(MODULES, value);
}

/**
 * The engine loop handles modules without knowing their concrete types. This is the
 * single place where a module's State, Action and Rules are erased to `unknown`;
 * the id on each instance keeps state and definition paired.
 */
export type AnyModuleDef = ModuleDef<ModuleId, unknown, unknown, unknown>;

export function moduleDef(id: ModuleId): AnyModuleDef {
  return MODULES[id] as AnyModuleDef;
}
