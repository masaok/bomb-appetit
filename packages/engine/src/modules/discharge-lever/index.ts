import { isRecord, type ModuleDef } from "../../types";

/** The meter's level is counted in milliseconds of filling, so a full meter is this many units. */
export const DISCHARGE_LEVER_FULL = 45_000;
/** Units drained per millisecond while the lever is held. Filling is 1 unit per millisecond. */
export const DISCHARGE_LEVER_DRAIN_RATE = 5;
/** The hint pulls the lever once the meter is above this level (60%). */
export const DISCHARGE_LEVER_PRESS_ABOVE = 27_000;

export type DischargeLeverRules = Record<string, never>;

export type DischargeLeverState =
  | { kind: "idle"; startAtMs: number }
  /** `level` is the meter reading at `atMs`; it has been filling or draining since. */
  | { kind: "running"; level: number; atMs: number; held: boolean };

export type DischargeLeverAction = { type: "press" } | { type: "release" };

/** Meter reading at `elapsedMs`, from 0 to `DISCHARGE_LEVER_FULL`. */
export function dischargeLeverLevel(state: DischargeLeverState, elapsedMs: number): number {
  if (state.kind === "idle") return 0;
  const dt = Math.max(0, elapsedMs - state.atMs);
  return state.held
    ? Math.max(0, state.level - dt * DISCHARGE_LEVER_DRAIN_RATE)
    : Math.min(DISCHARGE_LEVER_FULL, state.level + dt);
}

/** Whole percent, rounded down, so the meter reads 100 only when it is truly full. */
export function dischargeLeverPercent(state: DischargeLeverState, elapsedMs: number): number {
  return Math.floor((dischargeLeverLevel(state, elapsedMs) * 100) / DISCHARGE_LEVER_FULL);
}

export const dischargeLever: ModuleDef<
  "discharge-lever",
  DischargeLeverState,
  DischargeLeverAction,
  DischargeLeverRules
> = {
  id: "discharge-lever",
  name: "Discharge Lever",
  kind: "needy",

  generateRules() {
    return {};
  },

  generate(rng) {
    return { kind: "idle", startAtMs: rng.int(20_000, 45_000) };
  },

  apply(state, action, ctx) {
    const held = action.type === "press";
    if (state.kind !== "running" || state.held === held) return { state };
    return {
      state: { kind: "running", level: dischargeLeverLevel(state, ctx.elapsedMs), atMs: ctx.elapsedMs, held },
    };
  },

  nextEventAt(state) {
    if (state.kind === "idle") return state.startAtMs;
    return state.held ? null : state.atMs + (DISCHARGE_LEVER_FULL - state.level);
  },

  tick(state) {
    if (state.kind === "idle") {
      return { state: { kind: "running", level: 0, atMs: state.startAtMs, held: false } };
    }
    if (state.held) return { state };
    // Restart from the moment it filled, not from when the tick ran, so replays agree to the millisecond.
    const fullAtMs = state.atMs + (DISCHARGE_LEVER_FULL - state.level);
    return { state: { kind: "running", level: 0, atMs: fullAtMs, held: false }, strike: true };
  },

  hint(state, ctx) {
    if (state.kind !== "running") return null;
    const level = dischargeLeverLevel(state, ctx.elapsedMs);
    if (state.held) return level === 0 ? { type: "release" } : null;
    return level > DISCHARGE_LEVER_PRESS_ABOVE ? { type: "press" } : null;
  },

  parseAction(raw) {
    if (!isRecord(raw)) return null;
    if (raw.type === "press") return { type: "press" };
    if (raw.type === "release") return { type: "release" };
    return null;
  },
};
