import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The private package is linted in its own repository.
    ".cloud/**",
    "public/cloud/**",
    "drizzle/**",
    "e2e/.results/**",
  ]),
]);

export default eslintConfig;
