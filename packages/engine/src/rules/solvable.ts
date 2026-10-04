import { generateEdgework } from "../edgework";
import { createRng, type Rng } from "../rng";
import { timerText } from "../timer";
import type { ModuleContext, ModuleDef } from "../types";

export type SolvableVerdict = { ok: true } | { ok: false; reason: string };

export interface SolvableOptions {
  samples?: number;
  seed?: string;
}

const CHECK_TIMER_MS = 10 * 60_000;
const REGULAR_DEADLINE_MS = 3 * 60_000;
const NEEDY_SURVIVE_MS = 90_000;

/**
 * Plays `samples` random instances of one module by following its own hints and
 * confirms each regular module reaches "solved" (and each needy module survives)
 * without a strike. A rule set that fails here would print a manual that lies.
 */
export function checkModuleSolvable<State, Action, Rules>(
  def: ModuleDef<string, State, Action, Rules>,
  rules: Rules,
  options: SolvableOptions = {},
): SolvableVerdict {
  const samples = options.samples ?? 1000;
  const base = createRng(options.seed ?? `solvable:${def.id}`);

  for (let i = 0; i < samples; i++) {
    const rng = base.fork(String(i));
    const edgework = generateEdgework(rng.fork("edgework"));
    const strikes = rng.int(0, 2);
    let state = def.generate(rng.fork("module"), { edgework }, rules);
    let elapsedMs = 0;
    let done = false;

    for (let step = 0; step < 5000 && !done; step++) {
      const remainingMs = CHECK_TIMER_MS - elapsedMs;
      const ctx: ModuleContext<Rules> = {
        rules,
        edgework,
        strikes,
        elapsedMs,
        remainingMs,
        timerText: timerText(remainingMs),
      };

      const due = def.nextEventAt?.(state) ?? null;
      if (due !== null && due <= elapsedMs && def.tick) {
        const ticked = def.tick(state, ctx);
        if (ticked.strike) return { ok: false, reason: `sample ${i}: timed event struck at ${elapsedMs} ms` };
        state = ticked.state;
        continue;
      }

      const action = def.hint(state, ctx);
      if (action === null) {
        elapsedMs += 100;
        if (def.kind === "needy" && elapsedMs >= NEEDY_SURVIVE_MS) done = true;
        if (def.kind === "regular" && elapsedMs >= REGULAR_DEADLINE_MS) {
          return { ok: false, reason: `sample ${i}: no correct action within ${REGULAR_DEADLINE_MS} ms` };
        }
        continue;
      }

      const result = def.apply(state, action, ctx);
      if (result.strike) return { ok: false, reason: `sample ${i}: hinted action struck` };
      state = result.state;
      if (result.solved) done = true;
      elapsedMs += 50;
    }

    if (!done) return { ok: false, reason: `sample ${i}: not finished after 5000 steps` };
  }
  return { ok: true };
}

/**
 * Draws candidate rule sets until one passes `accept`. Each try uses its own fork,
 * so the accepted result is still a pure function of the rule seed.
 */
export function generateSolvableRules<Rules>(
  ruleRng: Rng,
  propose: (rng: Rng) => Rules,
  accept: (rules: Rules) => boolean,
  maxTries = 200,
): Rules {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const rules = propose(ruleRng.fork(`try${attempt}`));
    if (accept(rules)) return rules;
  }
  throw new Error(`No solvable rule set after ${maxTries} tries (rng key ${ruleRng.key})`);
}
