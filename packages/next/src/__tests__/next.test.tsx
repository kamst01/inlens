import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InLens } from "../index";

describe("@inlens/next", () => {
  it("server-renders the compound API directly through the Next.js entry", () => {
    const html = renderToStaticMarkup(
      <InLens.Root zoom={2}>
        <InLens.Image>
          <img src="/product.jpg" width={600} height={400} alt="Product" />
        </InLens.Image>
        <InLens.Lens>
          <InLens.Magnified>
            <img src="/product.jpg" width={1200} height={800} alt="" />
          </InLens.Magnified>
        </InLens.Lens>
      </InLens.Root>,
    );

    expect(html).toContain('data-inlens-slot="root"');
    expect(html).toContain('data-inlens-state="idle"');
    expect(html).toContain('data-inlens-slot="lens"');
    expect(html).toContain('data-inlens-slot="magnified"');
  });
});
