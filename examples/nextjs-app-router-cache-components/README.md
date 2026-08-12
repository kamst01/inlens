# InLens Cache Components example

A Next.js 16 catch-all recipe route backed by DummyJSON. `cacheComponents` is enabled and the
recipe UI uses `"use cache"`, `cacheLife("hours")`, and recipe-specific cache tags. Runtime route
params are resolved beneath `Suspense`, then passed as a serializable cache-key argument.

The primary recipe image is a CSS-owned `@inlens/next` surface with a separate detail panel.
Related-recipe images remain ordinary `next/image` navigation-card media. Tailwind CSS v4 owns the
page layout and presentation.

The cached Server Component composes `InLens.Root`, `InLens.Image`, `InLens.Tracker`,
`InLens.Panel`, and `InLens.Magnified` directly. Recipe data and image markup stay on the server;
only InLens's private runtime hydrates.

```bash
npm run dev -w nextjs-app-router-cache-components
```

Open `http://localhost:3000/recipes/1/classic-margherita-pizza`.
