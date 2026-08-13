import { createElement } from "react";
import type { ReactElement } from "react";
import type { MagnifiedProps } from "./types/props";

/**
 * Renders consumer-owned magnified content inside a Lens or Panel viewport.
 *
 * @remarks
 * Magnified is server-compatible and renders its child unchanged. The private Root runtime
 * publishes `--inlens-x` and `--inlens-y`; CSS applies translation, scaling, and sizing.
 *
 * @example
 * ```tsx
 * <InLens.Lens className="lens">
 *   <InLens.Magnified className="magnified-image">
 *     <img src="/product.jpg" width={1200} height={800} alt="" />
 *   </InLens.Magnified>
 * </InLens.Lens>
 * ```
 *
 * @returns The selected intrinsic wrapper containing the original child element.
 *
 * @see {@link MagnifiedProps}
 */
export function Magnified({ children, as = "div", ...nativeProps }: MagnifiedProps): ReactElement {
  return createElement(
    as,
    {
      ...nativeProps,
      "data-inlens-slot": "magnified",
    },
    children,
  );
}
