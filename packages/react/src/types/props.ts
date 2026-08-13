import type { HTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Props for {@link Root}, the measured source surface and behavior owner.
 *
 * @remarks
 * CSS defines the Root's dimensions. InLens measures its rendered border box and publishes the
 * result as read-only custom properties without applying layout or presentation styles. All native
 * HTML attributes and event handlers are forwarded to the wrapper.
 */
export interface RootProps extends HTMLAttributes<HTMLElement> {
  /**
   * The finite magnification factor, greater than or equal to `1`.
   *
   * Published as `--inlens-zoom`. Consumer CSS should render the magnified surface at this scale.
   *
   * @defaultValue `2`
   */
  zoom?: number;
  /**
   * Prevents pointer activation and deactivates an active magnifier when `true`.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
  /**
   * The intrinsic element used for the root wrapper.
   *
   * @defaultValue `"div"`
   */
  as?: "div" | "figure";
  /**
   * The source image, magnifier parts, and any consumer-owned decorative content.
   *
   * A Root should normally contain exactly one {@link Image}.
   */
  children: ReactNode;
}

/**
 * Props for {@link Image}, the wrapper around the consumer-owned source element.
 *
 * @remarks
 * InLens renders the child unchanged: it does not clone it, inspect its dimensions, or alter
 * its props. All native HTML attributes and event handlers are forwarded to the wrapper.
 */
export interface ImageProps extends HTMLAttributes<HTMLElement> {
  /** Exactly one consumer-owned source element, rendered without inspection or cloning. */
  children: ReactElement;
  /**
   * The intrinsic element used for the image wrapper.
   *
   * @defaultValue `"div"`
   */
  as?: "div" | "span";
}

/**
 * Props for {@link Lens}, a CSS-sized pointer-following viewport over the source.
 *
 * @remarks
 * Lens is always rendered. Consumer CSS owns its dimensions, positioning, clipping, visibility,
 * shape, and presentation. InLens measures its border box and publishes translation variables. All
 * native HTML attributes and event handlers are forwarded to the wrapper.
 */
export interface LensProps extends HTMLAttributes<HTMLElement> {
  /** Magnified content and any other consumer-owned viewport content. */
  children: ReactNode;
  /**
   * The intrinsic element used for the lens wrapper.
   *
   * @defaultValue `"div"`
   */
  as?: "div" | "span";
}

/**
 * Props for {@link Panel}, a consumer-positioned magnified viewport.
 *
 * @remarks
 * Panel is always rendered. Consumer CSS exclusively owns its dimensions, positioning,
 * visibility, clipping, and presentation. InLens measures its border box for magnification and
 * Tracker calculations but emits no Panel layout variables. All native HTML attributes and event
 * handlers are forwarded to the wrapper.
 */
export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Magnified content and any other consumer-owned viewport content. */
  children: ReactNode;
  /**
   * The intrinsic element used for the panel wrapper.
   *
   * @defaultValue `"div"`
   */
  as?: "div" | "aside";
}

/**
 * Props for {@link Tracker}, the source overlay representing the first Panel's viewport.
 *
 * @remarks
 * Tracker is always rendered and requires a Panel in the same Root. It throws after hydration
 * when no Panel exists. Consumer CSS owns its layout, visibility, and presentation. All native HTML
 * attributes and event handlers are forwarded to the wrapper.
 */
export interface TrackerProps extends HTMLAttributes<HTMLElement> {
  /** Optional consumer-owned content rendered inside the source overlay. */
  children?: ReactNode;
  /**
   * The intrinsic element used for the tracker wrapper.
   *
   * @defaultValue `"div"`
   */
  as?: "div" | "span";
}

/**
 * Props for {@link Magnified}, a translated wrapper around consumer-owned magnified content.
 *
 * @remarks
 * Magnified must be rendered inside a Lens or Panel. InLens renders its child unchanged and
 * publishes translation through `--inlens-x` and `--inlens-y`; consumer CSS applies the transform.
 * All native HTML attributes and event handlers are forwarded to the wrapper.
 */
export interface MagnifiedProps extends HTMLAttributes<HTMLElement> {
  /**
   * Exactly one consumer-owned element, rendered without inspection or cloning.
   *
   * Consumer CSS must give the magnified surface a coordinate system matching the Root zoom.
   */
  children: ReactElement;
  /**
   * The intrinsic element used for the magnified wrapper.
   *
   * @defaultValue `"div"`
   */
  as?: "div" | "span";
}
