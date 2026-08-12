# `@inlens/next`

RSC-first Next.js entry for InLens. It is a neutral re-export of `@inlens/react`; all public components are
server-compatible, and only Root's private runtime is a Client Component.

InLens ships no stylesheet and applies no layout or presentation properties. The application owns all CSS,
including responsive Root, Lens, and Panel dimensions.

```tsx
import Image from "next/image";
import { InLens } from "@inlens/next";

export default function ServerComponent() {
  return (
    <InLens.Root zoom={2} className="product-root">
      <InLens.Image className="source-image">
        <Image src="/product.jpg" fill sizes="500px" alt="Product" />
      </InLens.Image>
      <InLens.Lens className="lens">
        <InLens.Magnified>
          <Image src="/product.jpg" fill sizes="1000px" alt="" />
        </InLens.Magnified>
      </InLens.Lens>
    </InLens.Root>
  );
}
```

No handwritten client wrapper is required. Image and Magnified render their child verbatim.
