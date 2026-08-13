import { createElement } from "react";
import type { ReactElement } from "react";
import type { PanelProps } from "./types/props";

/**
 * Renders a server-compatible magnified viewport positioned entirely by consumer CSS.
 *
 * @remarks
 * Panel is always present and emits no layout variables. Consumer CSS exclusively owns its size,
 * position, clipping, visibility, and presentation. The private Root runtime measures its border
 * box for magnification and Tracker calculations.
 *
 * A Tracker represents the first Panel in DOM order when multiple Panels are present.
 *
 * @example
 * ```tsx
 * <InLens.Panel className="panel">
 *   <InLens.Magnified>
 *     <img src="/product.jpg" width={1200} height={800} alt="" />
 *   </InLens.Magnified>
 * </InLens.Panel>
 * ```
 *
 * @returns The selected intrinsic wrapper and its children.
 *
 * @see {@link PanelProps}
 */
export function Panel({ children, as = "div", ...nativeProps }: PanelProps): ReactElement {
  return createElement(as, { ...nativeProps, "data-inlens-slot": "panel" }, children);
}
