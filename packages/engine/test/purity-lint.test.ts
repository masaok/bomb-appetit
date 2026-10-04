import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// The engine's purity rules live in eslint.config.mjs. This proves they fire: a rule
// nobody has seen fail is not known to work.
async function messagesFor(code: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: new URL("..", import.meta.url).pathname });
  const [result] = await eslint.lintText(code, { filePath: "src/modules/fixture/index.ts" });
  return (result?.messages ?? []).map((m) => m.ruleId ?? "unknown");
}

describe("engine purity lint", () => {
  it.each([
    ["Date.now()", "export const t = Date.now();", "no-restricted-properties"],
    ["Math.random()", "export const r = Math.random();", "no-restricted-properties"],
    ["new Date()", "export const d = new Date();", "no-restricted-syntax"],
    [
      "a React import",
      'import { useState } from "react";\nexport const s = useState;',
      "no-restricted-imports",
    ],
    [
      "a Node import",
      'import { readFileSync } from "node:fs";\nexport const f = readFileSync;',
      "no-restricted-imports",
    ],
    ["the DOM", "export const w = window.innerWidth;", "no-restricted-globals"],
    ["setTimeout", "export const h = setTimeout(() => {}, 1);", "no-restricted-globals"],
  ])("rejects %s in engine source", async (_label, code, rule) => {
    expect(await messagesFor(code)).toContain(rule);
  });

  it("accepts pure code", async () => {
    expect(await messagesFor("export const double = (n: number) => n * 2;\n")).toEqual([]);
  });
});
