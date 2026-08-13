import type { ReactElement } from "react";
import { Runtime } from "./runtime";
import type { RootProps } from "./types/props";

/**
 * Creates an RSC-compatible, CSS-sized magnifier surface.
 *
 * @remarks
 * Root is server-compatible and delegates browser behavior to one private client runtime. CSS
 * defines the rendered size. InLens measures the border box and publishes
 * `--inlens-root-width`, `--inlens-root-height`, and `--inlens-zoom`, plus
 * `data-inlens-state="idle|active"`.
 *
 * Nested roots are independent and descendants always use the closest Root.
 *
 * @example
 * ```tsx
 * <InLens.Root className="product-inlens" zoom={2}>
 *   <InLens.Image>
 *     <img src="/product.jpg" width={600} height={400} alt="Product" />
 *   </InLens.Image>
 *   <InLens.Lens className="product-lens">
 *     <InLens.Magnified>
 *       <img src="/product.jpg" width={1200} height={800} alt="" />
 *     </InLens.Magnified>
 *   </InLens.Lens>
 * </InLens.Root>
 * ```
 *
 * @returns The private runtime boundary that renders the selected intrinsic root element.
 *
 * @see {@link RootProps}
 */
export function Root({
  zoom = 2,
  disabled = false,
  as = "div",
  children,
  ...nativeProps
}: RootProps): ReactElement {
  if (!Number.isFinite(zoom) || zoom < 1) {
    throw new RangeError(`zoom must be finite and at least 1; received ${String(zoom)}`);
  }

  return (
    <Runtime zoom={zoom} disabled={disabled} as={as} {...nativeProps}>
      {children}
    </Runtime>
  );
}
