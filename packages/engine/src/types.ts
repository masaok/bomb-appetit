import type { BombContext, Edgework } from "./edgework";
import type { Rng } from "./rng";

export type ModuleKind = "regular" | "needy";

/** Everything a module may read when it handles an action or a timed event. */
export interface ModuleContext<Rules> {
  rules: Rules;
  edgework: Edgework;
  /** Strikes on the whole bomb so far. */
  strikes: number;
  /** Milliseconds since the bomb was armed. The only clock the engine knows. */
  elapsedMs: number;
  /** Milliseconds left on the countdown. */
  remainingMs: number;
  /** The countdown display, see `timerText`. */
  timerText: string;
}

export interface ModuleResult<State> {
  state: State;
  /** The action or event was a mistake. */
  strike?: boolean;
  /** The module is now solved. Needy modules never set this. */
  solved?: boolean;
}

/**
 * The contract every module implements. A module is a pure state machine:
 * no clocks, no randomness outside `Rng`, no DOM.
 */
export interface ModuleDef<Id extends string, State, Action, Rules> {
  id: Id;
  /** Display name, for example "Big Button". */
  name: string;
  kind: ModuleKind;

  /** Build this module's manual rules from the rule seed. Must be solvable for every bomb. */
  generateRules(ruleRng: Rng): Rules;

  /** Build one instance for a bomb. */
  generate(rng: Rng, bomb: BombContext, rules: Rules): State;

  /**
   * Handle one Defuser action. Must be total: any action that passes `parseAction`
   * is safe in any state (out-of-range or meaningless input is a no-op, not a throw).
   */
  apply(state: State, action: Action, ctx: ModuleContext<Rules>): ModuleResult<State>;

  /** Elapsed-ms time of this module's next timed event, or null when it has none pending. */
  nextEventAt?(state: State): number | null;

  /** Runs when the clock reaches `nextEventAt`. Must move `nextEventAt` forward or clear it. */
  tick?(state: State, ctx: ModuleContext<Rules>): ModuleResult<State>;

  /**
   * The correct action to take right now, or null when the right move is to wait
   * (or, for a needy module, when nothing is being asked).
   * Powers the solvability check, the bot used in tests, and the dev-only debug page.
   */
  hint(state: State, ctx: ModuleContext<Rules>): Action | null;

  /** Validate an untrusted value from a submitted run log. Null rejects the whole log. */
  parseAction(raw: unknown): Action | null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Integer check for values read from an untrusted action. */
export function isInt(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
