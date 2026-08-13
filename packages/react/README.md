# `@inlens/react`

RSC-first compound React image magnifier components backed by `@inlens/core`.

Every public component is server-compatible. `Root` introduces one private client runtime for observers
and pointer behavior, while the public compound structure is passed through as server-rendered children.

`@inlens/react` ships no stylesheet and sets no layout or presentation properties. CSS sizes and positions
every part; InLens measures Root, Lens, and Panel border boxes and publishes only reserved geometry custom
properties.

```tsx
import { InLens } from "@inlens/react";

<InLens.Root zoom={2} className="product-root">
  <InLens.Image className="source-image">
    <img src="/source.jpg" alt="Product" />
  </InLens.Image>
  <InLens.Lens className="lens">
    <InLens.Magnified>
      <img src="/large.jpg" alt="" />
    </InLens.Magnified>
  </InLens.Lens>
</InLens.Root>;
```

Image and Magnified render their child verbatim. See the repository README for the responsive CSS example,
complete variable contract, Panel and Tracker composition, and accessibility guidance.

Every compound component forwards native attributes and event handlers to its wrapper, including
`aria-*`, `data-*`, IDs, roles, mouse handlers, and keyboard handlers. Refs are not forwarded.
