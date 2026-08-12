# InLens ecommerce example

A minimal App Router product detail route backed by the DummyJSON products API. The main gallery
uses `@inlens/next` as an Amazon-style source tracker with a separate zoom panel. The page is a
Server Component; only InLens's private runtime hydrates. Tailwind CSS v4 utilities own the
shadcn-inspired layout and presentation.

The route composes `InLens.Root`, `InLens.Image`, `InLens.Tracker`, `InLens.Panel`, and
`InLens.Magnified` directly. Product data and image markup remain server-rendered children rather
than being moved into an example-owned Client Component.

```bash
npm run dev -w nextjs-app-router-ecommerce
```

Open `http://localhost:3000/products/1/essence-mascara-lash-princess`. The first numeric catch-all
segment selects the DummyJSON product id.
