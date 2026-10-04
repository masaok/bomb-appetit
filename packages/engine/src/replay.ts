import { generateBomb, remainingMs, validateSpec, type BombSpec, type BombState } from "./bomb";
import { act, advance, type LoggedAction } from "./engine";
import { moduleDef } from "./modules/registry";
import { isInt, isRecord } from "./types";

/** Bump when any module's logic or generation changes, so stored runs replay under the version that produced them. */
export const ENGINE_VERSION = "1";

export interface RunLog {
  actions: LoggedAction[];
  /** Elapsed ms when the Defuser's client stopped the clock. */
  endMs: number;
}

export const MAX_LOG_ACTIONS = 20_000;

export type ReplayResult = { ok: true; state: BombState } | { ok: false; error: string };

/**
 * Rebuilds a run from its seeds and action log. The log is untrusted input: every
 * action is validated by its module before it is applied.
 */
export function replay(spec: BombSpec, log: unknown): ReplayResult {
  const problem = validateSpec(spec);
  if (problem) return { ok: false, error: problem };
  if (!isRecord(log) || !Array.isArray(log.actions)) return { ok: false, error: "log must have an actions array" };
  if (log.actions.length > MAX_LOG_ACTIONS) return { ok: false, error: "log has too many actions" };
  const maxMs = spec.timeLimitMs + 60_000;
  if (!isInt(log.endMs, 0, maxMs)) return { ok: false, error: "endMs out of range" };

  let state = generateBomb(spec);
  let lastT = 0;
  for (const [i, raw] of log.actions.entries()) {
    if (!isRecord(raw) || !isInt(raw.t, lastT, log.endMs) || !isInt(raw.m, 0, state.modules.length - 1)) {
      return { ok: false, error: `action ${i} is malformed or out of order` };
    }
    const target = state.modules[raw.m];
    const parsed = target ? moduleDef(target.id).parseAction(raw.a) : null;
    if (parsed === null) return { ok: false, error: `action ${i} is not valid for its module` };
    state = act(state, { t: raw.t, m: raw.m, a: parsed });
    lastT = raw.t;
  }
  return { ok: true, state: advance(state, log.endMs) };
}

export interface RunSummary {
  result: "defused" | "exploded" | "abandoned";
  reason: string;
  timeRemainingMs: number;
  strikes: number;
  elapsedMs: number;
}

export function summarize(state: BombState): RunSummary {
  const base = { strikes: state.strikes, elapsedMs: state.elapsedMs };
  switch (state.phase.kind) {
    case "defused":
      return { ...base, result: "defused", reason: "All modules solved", timeRemainingMs: state.phase.remainingMs };
    case "exploded": {
      const cause = state.phase.cause;
      if (cause.kind === "time") return { ...base, result: "exploded", reason: "Time ran out", timeRemainingMs: 0 };
      const culprit = state.modules[cause.moduleIndex];
      const name = culprit ? moduleDef(culprit.id).name : "a module";
      return {
        ...base,
        result: "exploded",
        reason: `Strike ${state.strikes} on ${name}`,
        timeRemainingMs: remainingMs(state),
      };
    }
    case "armed":
      return { ...base, result: "abandoned", reason: "Left before the end", timeRemainingMs: remainingMs(state) };
  }
}
