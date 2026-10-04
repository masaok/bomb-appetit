import { MODULE_IDS, moduleDef, type ModuleId, type RuleBook } from "../modules/registry";
import { createRng } from "../rng";
import { FROZEN_RULES } from "./seed-1";

/** Rule seed 1 is the standard manual. It is stored as JSON so it never shifts when a generator changes. */
export const STANDARD_RULE_SEED = 1;

export const MAX_RULE_SEED = 999_999;

const cache = new Map<number, RuleBook>();

export function generateModuleRules(id: ModuleId, ruleSeed: number): unknown {
  return moduleDef(id).generateRules(createRng(`rules:${ruleSeed}`).fork(id));
}

/** The whole manual for a rule seed, as data. Generated once per seed, then cached. */
export function ruleBook(ruleSeed: number): RuleBook {
  const cached = cache.get(ruleSeed);
  if (cached) return cached;

  const frozen: Partial<Record<ModuleId, unknown>> = ruleSeed === STANDARD_RULE_SEED ? FROZEN_RULES : {};
  const entries = MODULE_IDS.map((id) => [id, frozen[id] ?? generateModuleRules(id, ruleSeed)]);
  // Each entry was produced by its own module's generator (or frozen from it), keyed by that module's id.
  const book = Object.fromEntries(entries) as RuleBook;
  cache.set(ruleSeed, book);
  return book;
}
