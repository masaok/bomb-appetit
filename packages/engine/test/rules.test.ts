import { describe, expect, it } from "vitest";
import {
  checkModuleSolvable,
  generateModuleRules,
  MODULE_IDS,
  moduleDef,
  ruleBook,
  STANDARD_RULE_SEED,
} from "../src";
import { FROZEN_RULES } from "../src/rules/seed-1";

// The full sweep of seeds 2 to 500 takes about two minutes, so CI runs it as its own
// step (`pnpm test:rules`). The default run covers a slice.
const lastSeed = process.env.FULL_RULES ? 500 : 40;

describe("standard manual (rule seed 1)", () => {
  it("is frozen for every module", () => {
    expect(Object.keys(FROZEN_RULES).sort()).toEqual([...MODULE_IDS].sort());
  });

  it.each(MODULE_IDS)("%s: the frozen file is what the generator produces", (id) => {
    // If this fails, a generator changed: run `pnpm rules:freeze` and bump ENGINE_VERSION.
    expect(FROZEN_RULES[id]).toEqual(JSON.parse(JSON.stringify(generateModuleRules(id, STANDARD_RULE_SEED))));
  });

  it.each(MODULE_IDS)("%s: the frozen rules are solvable", (id) => {
    expect(
      checkModuleSolvable(moduleDef(id), ruleBook(STANDARD_RULE_SEED)[id], { samples: 300, seed: "audit" }),
    ).toEqual({ ok: true });
  });
});

describe(`generated manuals (rule seeds 2 to ${lastSeed})`, () => {
  it("every module is solvable under every seed, checked on bombs the generator never saw", () => {
    const failures: string[] = [];
    for (let seed = 2; seed <= lastSeed; seed++) {
      for (const id of MODULE_IDS) {
        const verdict = checkModuleSolvable(moduleDef(id), ruleBook(seed)[id], {
          samples: 40,
          seed: `audit:${seed}`,
        });
        if (!verdict.ok) failures.push(`seed ${seed} ${id}: ${verdict.reason}`);
      }
    }
    expect(failures).toEqual([]);
  }, 600_000);

  it("gives different manuals for different seeds", () => {
    expect(JSON.stringify(ruleBook(2))).not.toBe(JSON.stringify(ruleBook(3)));
    expect(ruleBook(2)).toEqual(JSON.parse(JSON.stringify(ruleBook(2))));
  });
});
