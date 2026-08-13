# InLens contract

Use this reference when implementing, reviewing, or debugging an InLens composition. If an installed
version exposes different types, follow that version's public types.

## Public API

Import the namespace from the framework-specific package:

```tsx
import { InLens } from "@inlens/react";
// or, in Next.js App Router:
import { InLens } from "@inlens/next";
```

Every public component can render in a React Server Component.

| Part        | Purpose                                    | InLens-specific props                |
| ----------- | ------------------------------------------ | ------------------------------------ |
| `Root`      | Measured source surface and behavior owner | `zoom`, `disabled`, `as`, `children` |
| `Image`     | Verbatim source-element wrapper            | one element as `children`, `as`      |
| `Lens`      | Pointer-following viewport                 | `children`, `as`                     |
| `Panel`     | Consumer-positioned magnified viewport     | `children`, `as`                     |
| `Tracker`   | Source overlay for the first Panel         | optional `children`, `as`            |
| `Magnified` | Translated wrapper for duplicated content  | one element as `children`, `as`      |

Every part also accepts the native HTML attributes and event handlers for its selected wrapper,
including `className`, `style`, `id`, `role`, `aria-*`, `data-*`, and mouse or keyboard handlers.
Refs are not forwarded. The `data-inlens-*` attributes and `--inlens-*` CSS properties are reserved
for InLens runtime output.

`zoom` defaults to `2` and must be finite and at least `1`. `disabled` defaults to `false`.

Do not invent visual props. Root has no `width` or `height`; Lens has no `size` or `shape`; Panel has
no `width`, `height`, `position`, or `offset`.

## Markup and output variables

Every part receives `data-inlens-slot="root|image|lens|panel|tracker|magnified"`. Root also receives
`data-inlens-state="idle|active"`.

InLens publishes these read-only variables:

- Root: `--inlens-root-width`, `--inlens-root-height`, `--inlens-zoom`
- Lens: `--inlens-x`, `--inlens-y`
- Tracker: `--inlens-x`, `--inlens-y`, `--inlens-width`, `--inlens-height`
- Magnified: `--inlens-x`, `--inlens-y`

Panel emits no layout variables. Its measured border box is used internally for Panel magnification and
Tracker geometry.

## Complete compound example

```tsx
<InLens.Root zoom={2.5} className="product-magnifier">
  <InLens.Image className="product-source">
    <img src="/shoe.jpg" alt="Black leather shoe" />
  </InLens.Image>

  <InLens.Lens className="product-lens">
    <InLens.Magnified className="product-magnified">
      <img src="/shoe-hires.jpg" alt="" />
    </InLens.Magnified>
  </InLens.Lens>

  <InLens.Tracker className="product-tracker" />

  <InLens.Panel className="product-panel">
    <InLens.Magnified className="product-magnified">
      <img src="/shoe-hires.jpg" alt="" />
    </InLens.Magnified>
  </InLens.Panel>
</InLens.Root>
```

Use `next/image` elements in the same structure for Next.js. Do not wrap this composition in a
handwritten Client Component solely for InLens.

## Illustrative CSS

Adapt this recipe to the application's design system. It is not library output.

```css
.product-magnifier {
  position: relative;
  width: min(32rem, 80vw);
  aspect-ratio: 1;
}

.product-source,
.product-source img {
  display: block;
  width: 100%;
  height: 100%;
}

.product-source img {
  object-fit: cover;
}

.product-lens {
  position: absolute;
  inset: 0 auto auto 0;
  width: clamp(6rem, 28%, 9rem);
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  pointer-events: none;
  transform: translate3d(var(--inlens-x), var(--inlens-y), 0);
}

.product-panel {
  position: absolute;
  top: 50%;
  left: calc(100% + 1.5rem);
  width: 16rem;
  height: 16rem;
  overflow: hidden;
  pointer-events: none;
  transform: translateY(-50%);
}

.product-tracker {
  position: absolute;
  inset: 0 auto auto 0;
  width: var(--inlens-width);
  height: var(--inlens-height);
  pointer-events: none;
  transform: translate3d(var(--inlens-x), var(--inlens-y), 0);
}

.product-magnified {
  position: absolute;
  inset: 0 auto auto 0;
  width: var(--inlens-root-width, 100%);
  height: var(--inlens-root-height, 100%);
  pointer-events: none;
  transform: translate3d(var(--inlens-x), var(--inlens-y), 0) scale(var(--inlens-zoom));
  transform-origin: top left;
}

.product-magnified img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-magnifier[data-inlens-state="idle"] :is(.product-lens, .product-panel, .product-tracker) {
  visibility: hidden;
}
```

## Runtime behavior and failures

- Root owns one private client runtime. Public parts contain no hooks or browser APIs.
- One ResizeObserver measures the owned Root, Lens, and Panel border boxes.
- One MutationObserver discovers dynamic or streamed parts and ignores parts owned by nested Roots.
- Pointer movement publishes variables imperatively without causing React renders.
- Touch pointers do not activate; mouse and pen pointers do.
- A zero-sized Root, Lens, or Panel remains idle until CSS makes it measurable.
- Tracker without Panel throws after initial client discovery. Conditionally rendered or streamed
  Trackers must appear with their Panel in the same initial subtree.
- Magnified must be inside Lens or Panel.
- With multiple Panels, Tracker calculations use the first owned Panel in DOM order.
