import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@bombappetit/cloud": fileURLToPath(new URL("./lib/cloud-stub.tsx", import.meta.url)),
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}", "lib/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
