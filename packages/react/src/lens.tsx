import { createElement } from "react";
import type { ReactElement } from "react";
import type { LensProps } from "./types/props";

/**
 * Renders a server-compatible viewport that InLens tracks over the source.
 *
 * @remarks
 * Lens is always present. CSS owns its size, shape, positioning, clipping, visibility, transform,
 * and presentation. The private Root runtime measures it and publishes `--inlens-x` and
 * `--inlens-y`.
 *
 * @example
 * ```tsx
 * <InLens.Lens className="lens">
 *   <InLens.Magnified>
 *     <img src="/product.jpg" width={1200} height={800} alt="" />
 *   </InLens.Magnified>
 * </InLens.Lens>
 * ```
 *
 * @returns The selected intrinsic wrapper and its children.
 *
 * @see {@link LensProps}
 */
export function Lens({ children, as = "div", className, style }: LensProps): ReactElement {
  return createElement(as, { className, style, "data-inlens-slot": "lens" }, children);
}
