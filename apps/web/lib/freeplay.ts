import {
  MAX_RULE_SEED,
  moduleCapacity,
  NEEDY_MODULE_IDS,
  REGULAR_MODULE_IDS,
  SPEC_LIMITS,
  isModuleId,
  type BombSpec,
  type ModuleId,
} from "@bombappetit/engine";
import { z } from "zod";

const moduleId = z.custom<ModuleId>(isModuleId, "unknown module");

/** What a player chooses on the freeplay screen. The bomb seed is added by the server. */
export const freeplaySchema = z
  .object({
    moduleCount: z.int().min(1).max(23),
    needyCount: z.int().min(0).max(3),
    timeLimitMs: z.int().min(SPEC_LIMITS.minTimeMs).max(SPEC_LIMITS.maxTimeMs),
    strikeLimit: z.int().min(SPEC_LIMITS.minStrikes).max(SPEC_LIMITS.maxStrikes),
    modulePool: z.array(moduleId).min(1).max(REGULAR_MODULE_IDS.length),
    ruleSeed: z.int().min(1).max(MAX_RULE_SEED),
  })
  .refine((c) => c.moduleCount + c.needyCount <= moduleCapacity("4x3"), "too many modules")
  .refine(
    (c) => c.modulePool.every((id) => REGULAR_MODULE_IDS.includes(id)),
    "modulePool must hold regular modules",
  );

export type FreeplayConfig = z.infer<typeof freeplaySchema>;

/** Suggested countdown: 5:00 for three modules, a minute more for each module beyond that. */
export function suggestedTimeMs(moduleCount: number): number {
  return (5 + Math.max(0, moduleCount - 3)) * 60_000;
}

export const DEFAULT_FREEPLAY: FreeplayConfig = {
  moduleCount: 3,
  needyCount: 0,
  timeLimitMs: suggestedTimeMs(3),
  strikeLimit: 3,
  modulePool: REGULAR_MODULE_IDS,
  ruleSeed: 1,
};

export function freeplaySpec(config: FreeplayConfig, bombSeed: number): BombSpec {
  return {
    bombSeed,
    ruleSeed: config.ruleSeed,
    timeLimitMs: config.timeLimitMs,
    strikeLimit: config.strikeLimit,
    caseSize: config.moduleCount + config.needyCount <= moduleCapacity("3x2") ? "3x2" : "4x3",
    moduleCount: config.moduleCount,
    modulePool: config.modulePool,
    needyCount: config.needyCount,
    needyPool: config.needyCount > 0 ? NEEDY_MODULE_IDS : [],
  };
}

/** Freeplay settings travel in the URL so a setup can be bookmarked or shared. */
export function freeplayToQuery(config: FreeplayConfig): string {
  const params = new URLSearchParams({
    modules: String(config.moduleCount),
    needy: String(config.needyCount),
    time: String(config.timeLimitMs / 1000),
    strikes: String(config.strikeLimit),
    rule: String(config.ruleSeed),
  });
  if (config.modulePool.length < REGULAR_MODULE_IDS.length) params.set("pool", config.modulePool.join(","));
  return params.toString();
}

export function freeplayFromQuery(
  query: Record<string, string | string[] | undefined>,
): FreeplayConfig | null {
  const one = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : undefined);
  const num = (key: string, fallback: number) => (one(key) === undefined ? fallback : Number(one(key)));
  const parsed = freeplaySchema.safeParse({
    moduleCount: num("modules", DEFAULT_FREEPLAY.moduleCount),
    needyCount: num("needy", 0),
    timeLimitMs: num("time", suggestedTimeMs(num("modules", DEFAULT_FREEPLAY.moduleCount)) / 1000) * 1000,
    strikeLimit: num("strikes", 3),
    modulePool: one("pool")?.split(",") ?? REGULAR_MODULE_IDS,
    ruleSeed: num("rule", 1),
  });
  return parsed.success ? parsed.data : null;
}
