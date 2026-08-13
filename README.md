# InLens

InLens is an RSC-first, CSS-owned image magnifier for React and Next.js. It provides a
pointer-following Lens, an external Panel, and a Tracker that can be composed in any useful subset.

```tsx
import { InLens } from "@inlens/react";
// or
import { InLens } from "@inlens/next";
```

InLens ships no stylesheet. It sets no sizing, layout, positioning, clipping, visibility, transform,
or presentation properties. Your CSS owns all of them; InLens only publishes measured geometry through
reserved `--inlens-*` custom properties and interaction state through `data-inlens-state`.

`InLens.Image` and `InLens.Magnified` render their child verbatim. InLens never clones, inspects,
resizes, or modifies it.

```tsx
<InLens.Root zoom={2.5} className="product-inlens">
  <InLens.Image className="source-image">
    <img src="/shoe.jpg" alt="Black leather shoe" />
  </InLens.Image>
  <InLens.Lens className="lens">
    <InLens.Magnified>
      <img src="/shoe-hires.jpg" alt="" />
    </InLens.Magnified>
  </InLens.Lens>
  <InLens.Tracker className="tracker" />
  <InLens.Panel className="panel">
    <InLens.Magnified>
      <img src="/shoe-hires.jpg" alt="" />
    </InLens.Magnified>
  </InLens.Panel>
</InLens.Root>
```

The duplicate magnified image is normally decorative, so use `alt=""`. The source image retains the
meaningful alternative text. InLens adds no roles, traps no focus, and never becomes the only way to
perceive the image.

## Install

For React:

```sh
npm install @inlens/react
pnpm add @inlens/react
yarn add @inlens/react
bun add @inlens/react
```

For a Next.js App Router application:

```sh
npm install @inlens/next
pnpm add @inlens/next
yarn add @inlens/next
bun add @inlens/next
```

React, React DOM, and (for `@inlens/next`) Next.js are peer dependencies. The packages are ESM-only.

## Compound API

`InLens` is the primary namespace. Every part is also a named export, and every public component can be
rendered from a Server Component.

- `Root`: optional behavioral `zoom` (default `2`) and `disabled`, plus `as="div|figure"` and `children`.
- `Image`: one verbatim `ReactElement`, with `as="div|span"`.
- `Lens`: CSS-sized pointer-following viewport with `as="div|span"` and `children`.
- `Panel`: CSS-sized and CSS-positioned viewport with `as="div|aside"` and `children`.
- `Tracker`: source overlay calculated from the first Panel in DOM order, with `as="div|span"` and
  optional `children`. A Tracker without a Panel always throws after client discovery.
- `Magnified`: one verbatim `ReactElement`, with `as="div|span"`. It belongs inside a Lens or Panel.

Every compound component also accepts the native HTML attributes and event handlers for its selected
wrapper, including `className`, `style`, `id`, `role`, `aria-*`, `data-*`, and mouse or keyboard
handlers. Refs are not forwarded. The `data-inlens-*` attributes and `--inlens-*` CSS properties are
reserved for InLens runtime output.

All visual parts stay mounted in both interaction states. Use Root's `data-inlens-state="idle|active"`
in CSS when you want to change visibility. If a Tracker is conditionally rendered, its Panel must be in
the same initial conditional subtree. Nested Roots are independent; each runtime only discovers slots
whose closest Root is its own.

## CSS-owned responsive geometry

InLens observes the rendered border boxes of Root, Lens, and Panel. Those observations are the sole
geometry source, so changing CSS dimensions automatically recomputes the output variables. Input custom
properties cannot override measurements. A zero-sized Root, Lens, or Panel keeps its composition idle
until CSS supplies measurable dimensions.

This illustrative CSS creates one possible responsive magnifier. It is documentation, not package
output:

```css
.product-inlens {
  position: relative;
  width: min(500px, 80vw);
  aspect-ratio: 1;
}

.source-image,
.source-image img {
  display: block;
  width: 100%;
  height: 100%;
}

.lens {
  position: absolute;
  top: 0;
  left: 0;
  width: clamp(96px, 28%, 140px);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  pointer-events: none;
  transform: translate3d(var(--inlens-x), var(--inlens-y), 0);
}

.panel {
  position: absolute;
  top: 50%;
  left: calc(100% + 24px);
  width: 240px;
  height: 240px;
  overflow: hidden;
  pointer-events: none;
  transform: translateY(-50%);
}

.tracker {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--inlens-width);
  height: var(--inlens-height);
  pointer-events: none;
  transform: translate3d(var(--inlens-x), var(--inlens-y), 0);
}

:where([data-inlens-slot="magnified"]) {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--inlens-root-width, 100%);
  height: var(--inlens-root-height, 100%);
  pointer-events: none;
  transform: translate3d(var(--inlens-x), var(--inlens-y), 0) scale(var(--inlens-zoom));
  transform-origin: top left;
}

.product-inlens[data-inlens-state="idle"] :is(.lens, .panel, .tracker) {
  visibility: hidden;
}
```

The magnified example sizes its logical surface from the observed Root dimensions, then visually scales
that complete surface by `--inlens-zoom`. Consumers may instead provide already enlarged content, as long
as its rendered coordinate system matches the zoom calculation. A CSS transform on the complete InLens
surface can visually scale it, while ResizeObserver dimensions remain the logical coordinate system.

## Output contract

Every part exposes `data-inlens-slot="root|image|lens|panel|tracker|magnified"`. Root additionally exposes
`data-inlens-state="idle|active"`. There are no shape or position data attributes.

Treat these variables as read-only outputs:

- Root: `--inlens-root-width`, `--inlens-root-height`, `--inlens-zoom`
- Lens: `--inlens-x`, `--inlens-y`
- Tracker: `--inlens-x`, `--inlens-y`, `--inlens-width`, `--inlens-height`
- Magnified: `--inlens-x`, `--inlens-y`

Panel emits no layout variables. Its observed width and height are used internally for Panel magnification
and Tracker calculations. Pointer movement updates positional output variables imperatively without a
React render.

## Next.js and React Server Components

All six public components are server-compatible. `Root` renders one private Runtime Client Component,
which receives the server-rendered compound structure through `children`. Browser APIs, observers,
pointer behavior, and mutable refs live only behind that boundary. The `@inlens/next` entry is a neutral
re-export, so no handwritten client wrapper is required:

```tsx
import Image from "next/image";
import { InLens } from "@inlens/next";

export default function ProductPage() {
  return (
    <InLens.Root zoom={2} className="product-inlens">
      <InLens.Image className="source-image">
        <Image src="/shoe.jpg" fill sizes="(max-width: 700px) 80vw, 500px" alt="Black shoe" />
      </InLens.Image>
      <InLens.Lens className="lens">
        <InLens.Magnified>
          <Image src="/shoe-hires.jpg" fill sizes="1000px" alt="" />
        </InLens.Magnified>
      </InLens.Lens>
    </InLens.Root>
  );
}
```

## Performance and input behavior

One core controller owns pointer, scroll, and animation-frame work for a Root. Pointer moves cache the
latest client coordinates and schedule at most one animation frame. Cursor and measurement state stay in
refs and plain runtime data; pointer movement does not enter React state or reconciliation. One
ResizeObserver measures all owned Root, Lens, and Panel border boxes, while a MutationObserver discovers
streamed or conditionally mounted slots.

Touch pointers never activate. Mouse and pen pointers do, including a mouse on a hybrid touchscreen.
While active, captured scroll schedules the same pointer publication from cached viewport coordinates.

## Core API

Advanced consumers can install `@inlens/core` directly. It has no runtime dependencies and exports:

- `createMagnifierController({ container, disabled? })`
- `clamp(value, min, max)`
- `computeLensPosition(...)`
- `computeMagnifiedTranslate(...)`
- `computeTrackerRect(...)`
- `CursorPct`, `MagnifierController`, and `MagnifierControllerOptions`

The controller owns pointer behavior only. The React runtime observes component border boxes, while Core
owns the geometry calculations that turn those measurements into output coordinates. Core is safe to
import during SSR and has no React, React DOM, or Next.js imports.

## Repository checks

The example workspaces are intentionally different galleries:

- React Vite: Chromatic Triplets, Conspiracy Microscope, and Wormhole Radio.
- Next.js App Router: Astral Orrery, Radioactive Receipt, and Shattered Dream Cartography.

Together they exercise multiple Lenses, multiple Panels and first-Panel Tracker behavior, semantic `as`
parts, responsive viewport remeasurement, and direct Server Component composition. Every dimension,
shape, clip, transform, and idle-state presentation in these galleries comes from application CSS.

```sh
npm run check          # publishable-package lint, types, unit, boundary, and size checks
npm run test:browser   # mount the React package source directly in real Chromium
```

Package CI never builds the example applications. Vitest covers Core, React, and the RSC-neutral Next.js
entry directly; Vitest Browser Mode uses Playwright to mount the React package source in Chromium without
a fixture application or web server. The example applications remain manually runnable demos and have no
dedicated CI, test, lint, or formatting workflow.

## AI agent skill

Install the repository's `inlens` skill to give Codex, Claude Code, Cursor, and other compatible coding
agents the current compound API, RSC boundary rules, CSS output contract, accessibility guidance, and
implementation checklist:

```sh
npx skills add kamst01/inlens --skill inlens
```

Add `--global` to make it available across projects. The skill follows the open Agent Skills format and
can also be used without installation:

```sh
npx skills use kamst01/inlens@inlens
```

## Releasing

InLens follows the official Changesets 3 workflow. Add release intent with `npm run changeset` and choose
`patch`, `minor`, or `major`. The public packages form one fixed group, so the highest pending impact
becomes their shared version. After changes reach `main`, the release workflow creates or updates the
Version Packages pull request; merging that pull request publishes every unpublished version.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the one-time repository and npm setup.

## License

MIT
