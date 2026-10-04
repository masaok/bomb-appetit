import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@bombappetit/cloud": fileURLToPath(new URL("./lib/cloud-stub.tsx", import.meta.url)),
      // `server-only` throws outside a React server build. Tests run the same modules in Node.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: [
      "test/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "lib/**/*.test.ts",
      "scripts/**/*.test.ts",
    ],
    setupFiles: ["./test/setup.ts"],
  },
});
