import { remainingMs, regularModules, type BombState } from "./bomb";
import { moduleDef, type ModuleInstance } from "./modules/registry";
import { ruleBook } from "./rules/book";
import { timerText } from "./timer";
import type { ModuleContext, ModuleResult } from "./types";

/** One Defuser input: at time `t` (elapsed ms), on module `m`, do `a`. */
export interface LoggedAction {
  t: number;
  m: number;
  a: unknown;
}

/** The countdown runs at (4 + strikes) / 4 speed: x1.25 after one strike, x1.5 after two. */
function rate(state: BombState): number {
  return 4 + state.strikes;
}

export function moduleContext(state: BombState, module: ModuleInstance): ModuleContext<unknown> {
  const left = remainingMs(state);
  return {
    rules: ruleBook(state.spec.ruleSeed)[module.id],
    edgework: state.edgework,
    strikes: state.strikes,
    elapsedMs: state.elapsedMs,
    remainingMs: left,
    timerText: timerText(left),
  };
}

function moveClock(state: BombState, toMs: number): BombState {
  const dt = toMs - state.elapsedMs;
  return { ...state, elapsedMs: toMs, remainingQ: state.remainingQ - dt * rate(state) };
}

function settle(state: BombState, index: number, result: ModuleResult<unknown>): BombState {
  const current = state.modules[index];
  if (!current) return state;
  const def = moduleDef(current.id);
  const solvedNow = result.solved === true && def.kind === "regular";

  const updated = {
    ...current,
    state: result.state,
    solved: current.solved || solvedNow,
    solvedAtMs: solvedNow ? state.elapsedMs : current.solvedAtMs,
    // `result.state` came from this module's own apply/tick.
  } as ModuleInstance;
  let next: BombState = { ...state, modules: state.modules.map((m, i) => (i === index ? updated : m)) };

  if (result.strike) {
    next = {
      ...next,
      strikes: next.strikes + 1,
      strikeLog: [...next.strikeLog, { atMs: next.elapsedMs, moduleIndex: index }],
    };
    if (next.strikes >= next.spec.strikeLimit) {
      return {
        ...next,
        phase: { kind: "exploded", atMs: next.elapsedMs, cause: { kind: "strikes", moduleIndex: index } },
      };
    }
  }

  if (solvedNow && regularModules(next).every((m) => m.solved)) {
    return { ...next, phase: { kind: "defused", atMs: next.elapsedMs, remainingMs: remainingMs(next) } };
  }
  return next;
}

/**
 * Moves the bomb's clock forward to `toMs`, firing every timed event on the way in
 * order: needy modules activating or expiring, and the countdown reaching zero.
 */
export function advance(state: BombState, toMs: number): BombState {
  let s = state;
  for (let guard = 0; guard < 100_000; guard++) {
    if (s.phase.kind !== "armed" || toMs <= s.elapsedMs) return s;

    const explodeAt = s.elapsedMs + Math.ceil(s.remainingQ / rate(s));
    let eventAt = Infinity;
    for (const m of s.modules) {
      if (m.solved) continue;
      const at = moduleDef(m.id).nextEventAt?.(m.state) ?? null;
      if (at !== null) eventAt = Math.min(eventAt, Math.max(at, s.elapsedMs));
    }

    const stopAt = Math.min(explodeAt, eventAt);
    if (stopAt > toMs) return moveClock(s, toMs);

    s = moveClock(s, stopAt);
    if (stopAt === explodeAt) {
      return { ...s, remainingQ: 0, phase: { kind: "exploded", atMs: s.elapsedMs, cause: { kind: "time" } } };
    }

    for (let i = 0; i < s.modules.length && s.phase.kind === "armed"; i++) {
      const m = s.modules[i];
      if (!m || m.solved) continue;
      const def = moduleDef(m.id);
      const at = def.nextEventAt?.(m.state) ?? null;
      if (at !== null && at <= s.elapsedMs && def.tick) {
        s = settle(s, i, def.tick(m.state, moduleContext(s, m)));
      }
    }
  }
  throw new Error("advance: a module's timed event never moved forward");
}

/** Applies one Defuser action. Actions on solved modules or a finished bomb are ignored. */
export function act(state: BombState, action: LoggedAction): BombState {
  const s = advance(state, action.t);
  if (s.phase.kind !== "armed") return s;
  const m = s.modules[action.m];
  if (!m || m.solved) return s;
  return settle(s, action.m, moduleDef(m.id).apply(m.state, action.a, moduleContext(s, m)));
}

/** The correct next action for one module right now, or null. Dev tools and tests only. */
export function hintFor(state: BombState, index: number): unknown {
  const m = state.modules[index];
  if (!m || m.solved || state.phase.kind !== "armed") return null;
  return moduleDef(m.id).hint(m.state, moduleContext(state, m));
}
