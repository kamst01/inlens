import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig({
  input: "src/index.ts",
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
    preserveModules: true,
    preserveModulesRoot: "src",
  },
});
