import type { BombState } from "./bomb";
import { act, advance, hintFor, type LoggedAction } from "./engine";
import type { RunLog } from "./replay";

export interface BotOptions {
  /** Pause after each of the bot's actions. A function lets a caller vary it per action. */
  actionGapMs?: number | ((actionIndex: number) => number);
  /** How far to move the clock when no module has a correct action yet. */
  waitMs?: number;
}

/**
 * Plays a bomb to the end by following each module's own hint. It exists to prove
 * bombs are completable and to produce logs for replay tests; it is not shipped to players.
 */
export function autoPlay(start: BombState, options: BotOptions = {}): { state: BombState; log: RunLog } {
  const gap = options.actionGapMs ?? 400;
  const gapAfter = (index: number) => (typeof gap === "number" ? gap : gap(index));
  const waitMs = options.waitMs ?? 100;
  const actions: LoggedAction[] = [];
  let state = start;

  for (let guard = 0; guard < 1_000_000 && state.phase.kind === "armed"; guard++) {
    let acted = false;
    for (let m = 0; m < state.modules.length && state.phase.kind === "armed"; m++) {
      // Stay on one module while it has a correct action, as a player would. Leaving
      // between a press and its release would turn every tap into a hold.
      for (let burst = 0; burst < 64 && state.phase.kind === "armed"; burst++) {
        // Hint and action share one timestamp, so timer-reading rules see the same display.
        const a = hintFor(state, m);
        if (a === null) break;
        const action = { t: state.elapsedMs, m, a };
        actions.push(action);
        state = advance(act(state, action), state.elapsedMs + gapAfter(actions.length));
        acted = true;
      }
    }
    if (!acted) state = advance(state, state.elapsedMs + waitMs);
  }
  return { state, log: { actions, endMs: state.elapsedMs } };
}
