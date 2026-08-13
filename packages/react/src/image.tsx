import { createElement } from "react";
import type { ReactElement } from "react";
import type { ImageProps } from "./types/props";

/**
 * Renders the consumer-owned source element inside a server-compatible, unstyled wrapper.
 *
 * @remarks
 * Image does not inspect, clone, resize, or otherwise modify its child. The wrapper receives
 * `data-inlens-slot="image"`; all sizing and presentation remain consumer-controlled.
 *
 * @example
 * ```tsx
 * <InLens.Image className="source-image">
 *   <img src="/product.jpg" width={600} height={400} alt="Product" />
 * </InLens.Image>
 * ```
 *
 * @returns The selected intrinsic wrapper containing the original child element.
 *
 * @see {@link ImageProps}
 */
export function Image({ children, as = "div", ...nativeProps }: ImageProps): ReactElement {
  return createElement(
    as,
    {
      ...nativeProps,
      "data-inlens-slot": "image",
    },
    children,
  );
}
