import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig({
  input: {
    index: "src/index.ts",
    "internal/geometry": "src/internal/geometry.ts",
  },
  external: [/^[^./]/],
  platform: "neutral",
  tsconfig: true,
  plugins: [
    dts({
      generator: "oxc",
      resolver: "oxc",
      sourcemap: false,
    }),
  ],
  output: {
    dir: "dist",
    format: "es",
    comments: false,
    minify: true,
    entryFileNames: "[name].mjs",
    chunkFileNames: "[name].mjs",
    cleanDir: true,
  },
});
