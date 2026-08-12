import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import console from "node:console";
import { URL } from "node:url";

const repository = new URL("../", import.meta.url);
const rootPath = repository.pathname;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(path) {
  return readFile(join(rootPath, path), "utf8");
}

async function json(path) {
  return JSON.parse(await read(path));
}

async function sourceFiles(directory) {
  const found = [];
  async function visit(current) {
    for (const entry of await readdir(current)) {
      const absolute = join(current, entry);
      const info = await stat(absolute);
      if (info.isDirectory()) await visit(absolute);
      else if (/\.(?:ts|tsx)$/.test(entry) && !entry.includes(".test.")) found.push(absolute);
    }
  }
  await visit(join(rootPath, directory));
  return found;
}

const packageDirectories = ["packages/core", "packages/react", "packages/next"];
const manifests = await Promise.all(
  packageDirectories.map((directory) => json(`${directory}/package.json`)),
);

invariant(
  manifests.map(({ name }) => name).join(",") === "@inlens/core,@inlens/react,@inlens/next",
  "The repository must contain exactly the three intended publishable InLens packages.",
);

const [coreManifest, reactManifest, nextManifest] = manifests;
invariant(
  coreManifest.version === reactManifest.version && reactManifest.version === nextManifest.version,
  "All publishable InLens packages must use the same version.",
);
invariant(!coreManifest.dependencies, "Core must have zero runtime dependencies.");
invariant(
  JSON.stringify(reactManifest.dependencies) ===
    JSON.stringify({ "@inlens/core": coreManifest.version }),
  "React may depend at runtime only on the exact publishable Core version.",
);
invariant(
  JSON.stringify(nextManifest.dependencies) ===
    JSON.stringify({ "@inlens/react": reactManifest.version }),
  "Next may depend at runtime only on the exact publishable React version.",
);

for (const [directory, manifest] of packageDirectories.map((directory, index) => [
  directory,
  manifests[index],
])) {
  const expectedExports =
    manifest.name === "@inlens/core"
      ? [".", "./internal/geometry", "./package.json"]
      : [".", "./package.json"];
  invariant(
    JSON.stringify(Object.keys(manifest.exports)) === JSON.stringify(expectedExports),
    `${manifest.name} has an unexpected export map.`,
  );
  invariant(
    manifest.type === "module" && manifest.sideEffects === false,
    `${manifest.name} must be side-effect-free ESM.`,
  );
  invariant(
    manifest.types === "./dist/index.d.mts",
    `${manifest.name} must publish .d.mts declarations.`,
  );
  invariant(
    manifest.exports["."].import === "./dist/index.mjs" &&
      manifest.exports["."].types === "./dist/index.d.mts",
    `${manifest.name} has an invalid manual export map.`,
  );
  invariant(
    (await stat(join(rootPath, directory, "dist/index.mjs"))).isFile() &&
      (await stat(join(rootPath, directory, "dist/index.d.mts"))).isFile(),
    `${manifest.name} is missing its ESM build artifacts.`,
  );
}

invariant(
  coreManifest.exports["./internal/geometry"].import === "./dist/internal/geometry.mjs" &&
    coreManifest.exports["./internal/geometry"].types === "./dist/geometry.d.mts",
  "Core must publish its internal runtime geometry entry.",
);
invariant(
  (await stat(join(rootPath, "packages/core/dist/internal/geometry.mjs"))).isFile() &&
    (await stat(join(rootPath, "packages/core/dist/geometry.d.mts"))).isFile(),
  "Core is missing its internal runtime geometry artifacts.",
);

const coreSources = await sourceFiles("packages/core/src");
for (const file of coreSources) {
  const contents = await readFile(file, "utf8");
  invariant(
    !/from\s+["'](?:react|react-dom|next)(?:[/'"])/.test(contents),
    `Core imports a framework in ${relative(rootPath, file)}.`,
  );
}

const reactSources = await sourceFiles("packages/react/src");
const combinedReact = (await Promise.all(reactSources.map((file) => readFile(file, "utf8")))).join(
  "\n",
);
for (const prohibited of ["cloneElement", "useLayoutEffect", "asChild"]) {
  invariant(
    !combinedReact.includes(prohibited),
    `React source contains prohibited API: ${prohibited}.`,
  );
}
invariant(
  !/\.style\.(?:width|height|position|left|right|top|bottom|overflow|clipPath|visibility|display|transform)\s*=/.test(
    combinedReact,
  ),
  "React may not assign layout, clipping, visibility, or transform properties.",
);
const customProperties = [
  ...combinedReact.matchAll(/\.style\.(?:setProperty|removeProperty)\("([^"]+)"/g),
].map((match) => match[1]);
const allowedCustomProperties = new Set([
  "--inlens-root-width",
  "--inlens-root-height",
  "--inlens-zoom",
  "--inlens-x",
  "--inlens-y",
  "--inlens-width",
  "--inlens-height",
]);
invariant(customProperties.length > 0, "React must publish InLens custom properties.");
invariant(
  customProperties.every((property) => allowedCustomProperties.has(property)),
  "React publishes a custom property outside the reserved output contract.",
);
invariant(!/from\s+["'][^"']+\.css["']/.test(combinedReact), "React must not import CSS.");
invariant(combinedReact.includes('from "@inlens/core"'), "React must consume @inlens/core.");
invariant(
  combinedReact.includes('from "@inlens/core/internal/geometry"'),
  "React must delegate geometry to Core's internal runtime entry.",
);
invariant(
  !reactSources.some((file) => file.endsWith("/runtime-geometry.ts")),
  "React must not own a runtime geometry module.",
);
invariant(
  combinedReact.includes("createMagnifierController"),
  "React must delegate pointer ownership to the Core controller.",
);
for (const removedCoreExport of ["computePanelAnchor", "PanelPosition"]) {
  invariant(
    !combinedReact.includes(removedCoreExport),
    `React still references removed core export ${removedCoreExport}.`,
  );
  invariant(
    !(await read("packages/core/src/index.ts")).includes(removedCoreExport),
    `Core still publicly exports ${removedCoreExport}.`,
  );
  invariant(
    !(await read("packages/core/dist/index.d.mts")).includes(removedCoreExport),
    `Core declarations still publicly expose ${removedCoreExport}.`,
  );
}

const publicComponentModules = ["root", "image", "lens", "panel", "tracker", "magnified"];
for (const moduleName of publicComponentModules) {
  const source = await read(`packages/react/src/${moduleName}.tsx`);
  const built = await read(`packages/react/dist/${moduleName}.mjs`);
  invariant(
    !source.trimStart().startsWith('"use client"'),
    `${moduleName} source must remain server-compatible.`,
  );
  invariant(
    !built.trimStart().startsWith('"use client"'),
    `${moduleName} build must remain server-compatible.`,
  );
  invariant(
    !/\b(?:useEffect|useLayoutEffect|useRef|useState|window|document|ResizeObserver|MutationObserver)\b/.test(
      source,
    ),
    `${moduleName} source contains client-only behavior.`,
  );
}

for (const runtime of ["packages/react/src/runtime.tsx", "packages/react/dist/runtime.mjs"]) {
  invariant(
    (await read(runtime)).trimStart().startsWith('"use client";'),
    `${runtime} must retain the sole client directive.`,
  );
}

for (const file of reactSources) {
  const contents = await readFile(file, "utf8");
  const hasDirective = contents.trimStart().startsWith('"use client"');
  invariant(
    hasDirective === file.endsWith("/runtime.tsx"),
    `${relative(rootPath, file)} violates the single private client-boundary contract.`,
  );
}

for (const entry of await readdir(join(rootPath, "packages/react/dist"))) {
  if (!entry.endsWith(".mjs")) continue;
  const hasDirective = (await read(`packages/react/dist/${entry}`))
    .trimStart()
    .startsWith('"use client"');
  invariant(
    hasDirective === (entry === "runtime.mjs"),
    `packages/react/dist/${entry} violates the single private client-boundary contract.`,
  );
}

for (const neutral of [
  "packages/react/src/index.ts",
  "packages/react/src/namespace.ts",
  "packages/react/src/types/props.ts",
  "packages/react/dist/index.mjs",
  "packages/react/dist/namespace.mjs",
  "packages/next/src/index.ts",
  "packages/next/dist/index.mjs",
]) {
  invariant(
    !(await read(neutral)).trimStart().startsWith('"use client"'),
    `${neutral} must remain neutral.`,
  );
}

for (const directory of packageDirectories) {
  for (const entry of await readdir(join(rootPath, directory, "dist"))) {
    invariant(!entry.endsWith(".css"), `${directory} publishes an unexpected CSS file: ${entry}.`);
  }
}

const nextSource = await read("packages/next/src/index.ts");
invariant(
  nextSource.includes('export * from "@inlens/react";'),
  "The Next entry must be a neutral React re-export.",
);

console.log(
  "Package graph, CSS-free output, single private client boundary, RSC entry, and geometry outputs verified.",
);
