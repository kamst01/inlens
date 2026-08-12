import console from "node:console";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

const MAX_GZIP_BYTES = 2_500;

const build = await rolldown({
  input: "packages/react/src/runtime.tsx",
  external: [/^react(?:\/|$)/],
  platform: "browser",
  tsconfig: true,
});

try {
  const generated = await build.generate({
    comments: false,
    format: "es",
    minify: true,
  });
  const chunks = generated.output.filter((output) => output.type === "chunk");
  if (chunks.length !== 1) {
    throw new Error(`Expected one client runtime chunk; received ${chunks.length}.`);
  }

  const chunk = chunks[0];
  const gzipBytes = gzipSync(chunk.code, { level: 9 }).length;
  if (gzipBytes > MAX_GZIP_BYTES) {
    throw new Error(
      `InLens client runtime is ${gzipBytes} bytes gzip; budget is ${MAX_GZIP_BYTES} bytes.`,
    );
  }

  console.log(`InLens client runtime: ${gzipBytes} bytes gzip (budget: ${MAX_GZIP_BYTES}).`);
} finally {
  await build.close();
}
