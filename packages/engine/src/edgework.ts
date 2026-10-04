import type { Rng } from "./rng";

/** Labels on the bomb casing that manual rules refer to. All names are original. */
export const INDICATOR_LABELS = [
  "YUM", "NOM", "ZAP", "HOT", "ICE", "RAW", "FRY", "DIP", "JAM", "BRU", "MSG",
] as const;
export type IndicatorLabel = (typeof INDICATOR_LABELS)[number];

export const PORT_TYPES = ["hex", "twin", "ribbon", "coax", "slot", "trident"] as const;
export type PortType = (typeof PORT_TYPES)[number];

/** A holder carries one `cell` battery or a `pack` of two. */
export const BATTERY_KINDS = ["cell", "pack"] as const;
export type BatteryKind = (typeof BATTERY_KINDS)[number];

export interface Indicator {
  label: IndicatorLabel;
  lit: boolean;
}

export interface Edgework {
  /** Six characters, letters and digits, always ending in a digit. */
  serial: string;
  /** One entry per battery holder. */
  batteries: BatteryKind[];
  indicators: Indicator[];
  /** One entry per port plate. A plate can be empty. */
  portPlates: PortType[][];
}

/** What a module may read about the bomb it sits on. */
export interface BombContext {
  edgework: Edgework;
}

// O and I are left out because they read as 0 and 1 over voice.
const SERIAL_LETTERS = [..."ABCDEFGHJKLMNPQRSTUVWXYZ"];
const SERIAL_DIGITS = [..."0123456789"];

export function generateEdgework(rng: Rng): Edgework {
  const either = () => rng.pick(rng.bool() ? SERIAL_LETTERS : SERIAL_DIGITS);
  const serial = [
    either(),
    either(),
    rng.pick(SERIAL_DIGITS),
    rng.pick(SERIAL_LETTERS),
    rng.pick(SERIAL_LETTERS),
    rng.pick(SERIAL_DIGITS),
  ].join("");

  const batteries = Array.from({ length: rng.int(0, 4) }, () => rng.pick(BATTERY_KINDS));
  const indicators = rng
    .sample(INDICATOR_LABELS, rng.int(0, 3))
    .map((label) => ({ label, lit: rng.bool() }));
  const portPlates = Array.from({ length: rng.int(0, 3) }, () =>
    rng.sample(PORT_TYPES, rng.int(0, 3)),
  );

  return { serial, batteries, indicators, portPlates };
}

export function serialLastDigit(e: Edgework): number {
  return Number(e.serial[e.serial.length - 1]);
}

export function serialIsOdd(e: Edgework): boolean {
  return serialLastDigit(e) % 2 === 1;
}

export function serialHasVowel(e: Edgework): boolean {
  return /[AEIOU]/.test(e.serial);
}

export function batteryCount(e: Edgework): number {
  return e.batteries.reduce((sum, kind) => sum + (kind === "pack" ? 2 : 1), 0);
}

export function holderCount(e: Edgework): number {
  return e.batteries.length;
}

export function hasIndicator(e: Edgework, label: IndicatorLabel, lit?: boolean): boolean {
  return e.indicators.some((i) => i.label === label && (lit === undefined || i.lit === lit));
}

export function litIndicatorCount(e: Edgework): number {
  return e.indicators.filter((i) => i.lit).length;
}

export function portCount(e: Edgework, type?: PortType): number {
  return e.portPlates.flat().filter((p) => type === undefined || p === type).length;
}

export function hasPort(e: Edgework, type: PortType): boolean {
  return portCount(e, type) > 0;
}
