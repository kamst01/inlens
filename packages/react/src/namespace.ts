import { Image } from "./image";
import { Lens } from "./lens";
import { Magnified } from "./magnified";
import { Panel } from "./panel";
import { Root } from "./root";
import { Tracker } from "./tracker";

/**
 * The primary compound-component namespace for the InLens React API.
 *
 * @remarks
 * Every component is also available as a named export. The namespace and named exports are the
 * same component references, so applications can choose either style without changing behavior.
 *
 * @example
 * ```tsx
 * import { InLens } from "@inlens/react";
 *
 * <InLens.Root className="product-root">
 *   <InLens.Image>{sourceImage}</InLens.Image>
 *   <InLens.Lens className="product-lens">
 *     <InLens.Magnified>{magnifiedImage}</InLens.Magnified>
 *   </InLens.Lens>
 * </InLens.Root>;
 * ```
 */
export const InLens: {
  /** The CSS-sized coordinate system and behavior owner. See {@link Root}. */
  Root: typeof Root;
  /** The unstyled wrapper for a consumer-owned source element. See {@link Image}. */
  Image: typeof Image;
  /** The pointer-following magnified viewport. See {@link Lens}. */
  Lens: typeof Lens;
  /** The consumer-positioned magnified viewport. See {@link Panel}. */
  Panel: typeof Panel;
  /** The source overlay representing the first Panel. See {@link Tracker}. */
  Tracker: typeof Tracker;
  /** The translated wrapper for consumer-owned magnified content. See {@link Magnified}. */
  Magnified: typeof Magnified;
} = { Root, Image, Lens, Panel, Tracker, Magnified };
