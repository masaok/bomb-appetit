// Writes the standard manual (rule seed 1) to src/rules/seed-1/ as one JSON file per module.
// Run after a deliberate change to a rule generator, and bump ENGINE_VERSION with it.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODULE_IDS } from "../src/modules/registry";
import { generateModuleRules, STANDARD_RULE_SEED } from "../src/rules/book";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/rules/seed-1");
mkdirSync(dir, { recursive: true });

for (const id of MODULE_IDS) {
  writeFileSync(
    path.join(dir, `${id}.json`),
    JSON.stringify(generateModuleRules(id, STANDARD_RULE_SEED), null, 2) + "\n",
  );
}

const name = (id: string) => id.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
const index = [
  "// Written by `pnpm rules:freeze`. Do not edit by hand; edit the JSON files instead.",
  'import type { RuleBook } from "../../modules/registry";',
  ...MODULE_IDS.map((id) => `import ${name(id)} from "./${id}.json" with { type: "json" };`),
  "",
  "// JSON imports lose literal types (a color becomes `string`), so the compiler cannot",
  "// check these files against RuleBook. test/rules.test.ts does: it requires every frozen",
  "// file to equal what its generator produces for seed 1 at the frozen engine version.",
  "export const FROZEN_RULES = {",
  ...MODULE_IDS.map((id) => `  ${JSON.stringify(id)}: ${name(id)},`),
  "} as unknown as Partial<RuleBook>;",
  "",
].join("\n");
writeFileSync(path.join(dir, "index.ts"), index);
console.log(`Froze ${MODULE_IDS.length} rule sets to ${dir}`);
