import { execFile } from "node:child_process";
import console from "node:console";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import process from "node:process";
import { URL } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repository = resolve(new URL("../../", import.meta.url).pathname);
const managerFlag = process.argv.indexOf("--manager");
const packageManager = managerFlag === -1 ? "npm" : process.argv[managerFlag + 1];
const supportedManagers = new Set(["npm", "pnpm", "yarn", "bun"]);
if (!packageManager || !supportedManagers.has(packageManager)) {
  throw new Error(`Expected --manager to be one of: ${[...supportedManagers].join(", ")}.`);
}

const temporary = await mkdtemp(join(tmpdir(), `inlens-${packageManager}-packed-`));
const tarballs = join(temporary, "tarballs");
const cache = join(temporary, "npm-cache");

async function run(file, arguments_, options = {}) {
  const { env, quiet = false, ...execOptions } = options;
  const result = await exec(file, arguments_, {
    cwd: repository,
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      ...env,
    },
    ...execOptions,
  });
  if (!quiet && result.stdout.trim()) process.stdout.write(result.stdout);
  if (!quiet && result.stderr.trim()) process.stderr.write(result.stderr);
  return result;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function installFixture(cwd) {
  switch (packageManager) {
    case "npm":
      await run(
        "npm",
        ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--cache", cache],
        { cwd },
      );
      return;
    case "pnpm":
      await run("pnpm", ["install", "--ignore-scripts", "--no-frozen-lockfile"], { cwd });
      return;
    case "yarn":
      await run("yarn", ["install", "--no-immutable", "--mode=skip-builds"], {
        cwd,
        env: {
          YARN_ENABLE_SCRIPTS: "false",
          YARN_NODE_LINKER: "node-modules",
        },
      });
      return;
    case "bun":
      await run("bun", ["install", "--ignore-scripts"], { cwd });
  }
}

async function buildFixture(cwd) {
  const command =
    packageManager === "npm" ? ["npm", ["run", "build"]] : [packageManager, ["run", "build"]];
  await run(command[0], command[1], { cwd });
}

function localOverrides(coreTarball, reactTarball) {
  const overrides = {
    "@inlens/core": `file:${coreTarball}`,
    "@inlens/react": `file:${reactTarball}`,
  };

  switch (packageManager) {
    case "pnpm":
      return { pnpm: { overrides } };
    case "yarn":
      return { resolutions: overrides };
    case "bun":
      return { overrides };
    default:
      return {};
  }
}

try {
  await mkdir(tarballs, { recursive: true });
  await run("npm", ["run", "build"]);
  await run(packageManager, ["--version"]);

  const packageDirectories = ["packages/core", "packages/react", "packages/next"];
  const packed = new Map();
  for (const directory of packageDirectories) {
    const { stdout } = await run(
      "npm",
      [
        "pack",
        join(repository, directory),
        "--pack-destination",
        tarballs,
        "--json",
        "--cache",
        cache,
      ],
      { quiet: true },
    );
    const [{ filename }] = JSON.parse(stdout);
    const tarball = join(tarballs, filename);
    packed.set(directory, tarball);

    const listing = (await run("tar", ["-tzf", tarball], { quiet: true })).stdout
      .trim()
      .split("\n");
    for (const entry of listing) {
      if (/\.(?:map|ts|tsx)$/.test(entry) && !entry.endsWith(".d.mts")) {
        throw new Error(`${filename} contains source or source-map output: ${entry}`);
      }
      if (/\.css$/.test(entry)) {
        throw new Error(`${filename} contains an unexpected stylesheet: ${entry}`);
      }
    }
    for (const required of [
      "package/package.json",
      "package/LICENSE",
      "package/dist/index.mjs",
      "package/dist/index.d.mts",
    ]) {
      if (!listing.includes(required)) throw new Error(`${filename} is missing ${required}`);
    }

    const manifestText = (
      await run("tar", ["-xOf", tarball, "package/package.json"], {
        quiet: true,
      })
    ).stdout;
    if (manifestText.includes("workspace:")) {
      throw new Error(`${filename} contains an unpublishable workspace dependency specifier.`);
    }
  }

  const coreTarball = packed.get("packages/core");
  const reactTarball = packed.get("packages/react");
  const nextTarball = packed.get("packages/next");
  if (!coreTarball || !reactTarball || !nextTarball) throw new Error("Missing InLens tarball.");

  const viteFixture = join(temporary, "vite-consumer");
  await mkdir(join(viteFixture, "src"), { recursive: true });
  await writeJson(join(viteFixture, "package.json"), {
    private: true,
    type: "module",
    scripts: { build: "vite build" },
    dependencies: {
      "@inlens/core": `file:${coreTarball}`,
      "@inlens/react": `file:${reactTarball}`,
      react: "19.2.7",
      "react-dom": "19.2.7",
      vite: "8.1.5",
    },
    ...localOverrides(coreTarball, reactTarball),
  });
  await writeFile(
    join(viteFixture, "index.html"),
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>\n',
  );
  await writeFile(
    join(viteFixture, "src/main.jsx"),
    `import React from "react";
import { createRoot } from "react-dom/client";
import { InLens } from "@inlens/react";
createRoot(document.getElementById("root")).render(
  <InLens.Root style={{ width: 100, height: 100 }}>
    <InLens.Image><img width="100" height="100" alt="Product" /></InLens.Image>
    <InLens.Lens style={{ width: 20, height: 20 }}>Lens</InLens.Lens>
  </InLens.Root>,
);
`,
  );
  await installFixture(viteFixture);
  await buildFixture(viteFixture);

  const nextFixture = join(temporary, "next-consumer");
  await mkdir(join(nextFixture, "app"), { recursive: true });
  await mkdir(join(nextFixture, "public"), { recursive: true });
  await writeJson(join(nextFixture, "package.json"), {
    private: true,
    scripts: { build: "next build" },
    dependencies: {
      "@inlens/core": `file:${coreTarball}`,
      "@inlens/react": `file:${reactTarball}`,
      "@inlens/next": `file:${nextTarball}`,
      next: "16.3.0",
      react: "19.2.7",
      "react-dom": "19.2.7",
    },
    ...localOverrides(coreTarball, reactTarball),
  });
  await writeFile(
    join(nextFixture, "app/layout.js"),
    'export default function Layout({ children }) { return <html lang="en"><body>{children}</body></html>; }\n',
  );
  await writeFile(
    join(nextFixture, "app/page.js"),
    `import Image from "next/image";
import { InLens } from "@inlens/next";
export default function Page() {
  return <InLens.Root style={{ width: 100, height: 100 }}>
    <InLens.Image><Image src="/product.svg" width={100} height={100} alt="Product" /></InLens.Image>
    <InLens.Lens style={{ width: 20, height: 20 }}><InLens.Magnified><Image src="/product.svg" width={200} height={200} alt="" /></InLens.Magnified></InLens.Lens>
  </InLens.Root>;
}
`,
  );
  await writeFile(
    join(nextFixture, "public/product.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="navy"/></svg>\n',
  );
  await installFixture(nextFixture);
  await buildFixture(nextFixture);

  const viteOutput = await readFile(join(viteFixture, "dist/index.html"), "utf8");
  if (!viteOutput.includes("assets/"))
    throw new Error("Packed Vite consumer did not produce assets.");
  console.log(
    `Verified ${[...packed.values()].map((path) => basename(path)).join(", ")} with ${packageManager} in clean Vite and Next.js consumers.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
