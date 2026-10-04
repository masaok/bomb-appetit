import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// The engine must stay pure and deterministic so the server can replay any run.
// These rules are the enforcement; AGENTS.md only points here.
export default defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "next", "next/*", "node:*"],
              message: "packages/engine is pure TypeScript with zero runtime deps.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "No DOM in the engine." },
        { name: "document", message: "No DOM in the engine." },
        { name: "performance", message: "Time enters the engine through advance()/act()." },
        { name: "setTimeout", message: "Time enters the engine through advance()/act()." },
        { name: "setInterval", message: "Time enters the engine through advance()/act()." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: "Time enters the engine through advance()/act()." },
        { object: "Math", property: "random", message: "Use the seeded Rng." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "Time enters the engine through advance()/act().",
        },
      ],
    },
  },
]);
