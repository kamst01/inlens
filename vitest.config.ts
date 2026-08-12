import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@inlens/core/internal/geometry",
        replacement: fileURLToPath(
          new URL("./packages/core/src/internal/geometry.ts", import.meta.url),
        ),
      },
      {
        find: "@inlens/core",
        replacement: fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      },
      {
        find: "@inlens/react",
        replacement: fileURLToPath(new URL("./packages/react/src/index.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["packages/**/src/__tests__/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/*.browser.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["packages/{core,react}/src/**/*.{ts,tsx}"],
      exclude: ["**/__tests__/**", "**/index.ts", "**/types/**"],
    },
  },
});
