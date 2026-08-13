import { createElement } from "react";
import type { ReactElement } from "react";
import type { TrackerProps } from "./types/props";

/**
 * Renders a server-compatible source overlay for the first Panel in DOM order.
 *
 * @remarks
 * Tracker is always present. The private Root runtime publishes `--inlens-x`, `--inlens-y`,
 * `--inlens-width`, and `--inlens-height`; consumer CSS owns every visual property.
 *
 * Tracker and Panel may appear in either JSX order, but both must exist in the same initial Root
 * subtree. Consumer content is rendered unchanged inside the selected intrinsic wrapper.
 *
 * @example
 * ```tsx
 * <InLens.Tracker className="tracker" />
 * <InLens.Panel className="panel">
 *   <InLens.Magnified>{magnifiedImage}</InLens.Magnified>
 * </InLens.Panel>
 * ```
 *
 * @returns The selected intrinsic tracker wrapper and its children.
 *
 * @see {@link TrackerProps}
 */
export function Tracker({ children, as = "div", ...nativeProps }: TrackerProps): ReactElement {
  return createElement(as, { ...nativeProps, "data-inlens-slot": "tracker" }, children);
}
