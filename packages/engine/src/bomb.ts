import { generateEdgework, type Edgework } from "./edgework";
import { isModuleId, moduleDef, MODULES, type ModuleId, type ModuleInstance } from "./modules/registry";
import { createRng, type Rng } from "./rng";
import { MAX_RULE_SEED, ruleBook } from "./rules/book";

export const CASE_SIZES = {
  "3x2": { cols: 3, rows: 2 },
  "4x3": { cols: 4, rows: 3 },
} as const;
export type CaseSize = keyof typeof CASE_SIZES;

/** Two faces, and one slot is always the timer. */
export function moduleCapacity(caseSize: CaseSize): number {
  const { cols, rows } = CASE_SIZES[caseSize];
  return cols * rows * 2 - 1;
}

/** Everything needed to rebuild a bomb. This plus an action log is a whole run. */
export interface BombSpec {
  bombSeed: number;
  ruleSeed: number;
  timeLimitMs: number;
  strikeLimit: number;
  caseSize: CaseSize;
  moduleCount: number;
  modulePool: ModuleId[];
  needyCount: number;
  needyPool: ModuleId[];
}

export type Slot = { kind: "timer" } | { kind: "module"; index: number } | { kind: "empty" };

export interface StrikeRecord {
  atMs: number;
  moduleIndex: number;
}

export type ExplosionCause = { kind: "strikes"; moduleIndex: number } | { kind: "time" };

export type Phase =
  | { kind: "armed" }
  | { kind: "defused"; atMs: number; remainingMs: number }
  | { kind: "exploded"; atMs: number; cause: ExplosionCause };

export interface BombState {
  spec: BombSpec;
  edgework: Edgework;
  /** Front face slots first (row by row), then the back face. */
  slots: Slot[];
  modules: ModuleInstance[];
  strikes: number;
  strikeLog: StrikeRecord[];
  /** Real milliseconds since the bomb was armed. */
  elapsedMs: number;
  /**
   * Countdown left, in quarter-milliseconds. Strikes speed the countdown up by
   * a quarter each, so quarter units keep every step an exact integer.
   */
  remainingQ: number;
  phase: Phase;
}

export const SPEC_LIMITS = {
  minTimeMs: 30_000,
  maxTimeMs: 60 * 60_000,
  minStrikes: 1,
  maxStrikes: 5,
} as const;

/** Returns what is wrong with a spec, or null when it can be built. */
export function validateSpec(spec: BombSpec): string | null {
  const int = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
  if (!int(spec.bombSeed, 0, Number.MAX_SAFE_INTEGER)) return "bombSeed must be a non-negative safe integer";
  if (!int(spec.ruleSeed, 1, MAX_RULE_SEED)) return `ruleSeed must be 1 to ${MAX_RULE_SEED}`;
  if (!int(spec.timeLimitMs, SPEC_LIMITS.minTimeMs, SPEC_LIMITS.maxTimeMs)) return "timeLimitMs out of range";
  if (!int(spec.strikeLimit, SPEC_LIMITS.minStrikes, SPEC_LIMITS.maxStrikes))
    return "strikeLimit out of range";
  if (!Object.hasOwn(CASE_SIZES, spec.caseSize)) return "unknown caseSize";
  if (!int(spec.moduleCount, 1, 23) || !int(spec.needyCount, 0, 22)) return "module counts out of range";
  if (spec.moduleCount + spec.needyCount > moduleCapacity(spec.caseSize))
    return "too many modules for the case";
  const poolOk = (pool: ModuleId[], kind: "regular" | "needy") =>
    Array.isArray(pool) && pool.every((id) => isModuleId(id) && MODULES[id].kind === kind);
  if (!poolOk(spec.modulePool, "regular") || spec.modulePool.length === 0)
    return "modulePool must list regular modules";
  if (!poolOk(spec.needyPool, "needy")) return "needyPool must list needy modules";
  if (spec.needyCount > 0 && spec.needyPool.length === 0) return "needyPool is empty";
  return null;
}

/** Deals `count` ids from the pool, reshuffling each time the pool runs out. */
function deal(rng: Rng, pool: ModuleId[], count: number): ModuleId[] {
  const out: ModuleId[] = [];
  for (let round = 0; out.length < count; round++) {
    out.push(...rng.fork(String(round)).shuffle(pool));
  }
  return out.slice(0, count);
}

export function generateBomb(spec: BombSpec): BombState {
  const problem = validateSpec(spec);
  if (problem) throw new Error(`Invalid bomb spec: ${problem}`);

  const root = createRng(`bomb:${spec.bombSeed}`);
  const book = ruleBook(spec.ruleSeed);
  const edgework = generateEdgework(root.fork("edgework"));

  const ids = root
    .fork("order")
    .shuffle([
      ...deal(root.fork("regular"), spec.modulePool, spec.moduleCount),
      ...deal(root.fork("needy"), spec.needyPool, spec.needyCount),
    ]);

  const modules = ids.map((id, index) => ({
    id,
    state: moduleDef(id).generate(root.fork(`module:${index}:${id}`), { edgework }, book[id]),
    solved: false,
    solvedAtMs: null,
    // Each state came from the generator registered under the same id.
  })) as ModuleInstance[];

  const { cols, rows } = CASE_SIZES[spec.caseSize];
  const perFace = cols * rows;
  const timerSlot = root.fork("timer").int(0, perFace - 1);
  const slots: Slot[] = [];
  let next = 0;
  for (let i = 0; i < perFace * 2; i++) {
    if (i === timerSlot) slots.push({ kind: "timer" });
    else if (next < modules.length) slots.push({ kind: "module", index: next++ });
    else slots.push({ kind: "empty" });
  }

  return {
    spec,
    edgework,
    slots,
    modules,
    strikes: 0,
    strikeLog: [],
    elapsedMs: 0,
    remainingQ: spec.timeLimitMs * 4,
    phase: { kind: "armed" },
  };
}

export function remainingMs(state: BombState): number {
  return Math.max(0, Math.ceil(state.remainingQ / 4));
}

export function regularModules(state: BombState): ModuleInstance[] {
  return state.modules.filter((m) => MODULES[m.id].kind === "regular");
}

export function solvedCount(state: BombState): number {
  return regularModules(state).filter((m) => m.solved).length;
}
