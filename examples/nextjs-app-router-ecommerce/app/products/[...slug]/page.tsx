import { InLens } from "@inlens/next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ProductReview {
  rating: number;
  comment: string;
  reviewerName: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  returnPolicy: string;
  thumbnail: string;
  images: string[];
  reviews: ProductReview[];
}

function parseProductId(slug: string[]): number | null {
  const id = slug.find((part) => /^\d+$/.test(part));
  if (!id) return null;

  const parsed = Number(id);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function getProduct(id: number): Promise<Product | null> {
  const response = await fetch(`https://dummyjson.com/products/${id}`, {
    next: { revalidate: 60 * 60 },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`DummyJSON returned ${response.status} for product ${id}.`);

  return (await response.json()) as Product;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-2 text-sm text-amber-700"
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden="true">★★★★★</span>
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

function ProductMagnifier({ product }: { product: Product }) {
  const image = product.images[0] ?? product.thumbnail;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 min-[561px]:grid-cols-[66px_minmax(0,1fr)]">
      <div
        className="order-2 flex gap-2.5 overflow-x-auto min-[561px]:order-0 min-[561px]:flex-col"
        aria-label="Product images"
      >
        {product.images.slice(0, 5).map((src, index) => (
          <div
            className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 data-[selected=true]:border-zinc-900 data-[selected=true]:shadow-[0_0_0_1px_#18181b]"
            data-selected={index === 0 ? "true" : undefined}
            key={src}
          >
            <Image className="object-contain" src={src} fill sizes="64px" alt="" />
          </div>
        ))}
      </div>

      <InLens.Root
        as="figure"
        zoom={2.35}
        className="group/inlens relative m-0 aspect-square w-full touch-none"
      >
        <InLens.Image className="absolute inset-0 overflow-hidden rounded-xl border border-zinc-200 bg-linear-to-br from-zinc-50 to-zinc-100">
          <Image
            className="object-contain"
            src={image}
            fill
            loading="eager"
            sizes="(max-width: 760px) 92vw, 520px"
            alt={product.title}
          />
        </InLens.Image>

        <InLens.Tracker className="inlens-follow invisible absolute top-0 left-0 z-4 h-(--inlens-height) w-(--inlens-width) border border-blue-600 bg-blue-600/12 pointer-events-none group-data-[inlens-state=active]/inlens:visible" />

        <InLens.Panel
          as="aside"
          className="invisible absolute top-0 left-[18%] z-20 aspect-square w-[82%] overflow-hidden rounded-xl border border-zinc-400 bg-zinc-50 shadow-[0_20px_50px_rgb(24_24_27/18%)] pointer-events-none group-data-[inlens-state=active]/inlens:visible max-[820px]:inset-0 max-[820px]:w-full min-[1181px]:left-[calc(100%+clamp(28px,4vw,64px))] min-[1181px]:w-[min(560px,44vw)]"
        >
          <InLens.Magnified className="inlens-magnified">
            <Image className="object-contain" src={image} fill sizes="1220px" alt="" />
          </InLens.Magnified>
          <span className="absolute right-3 bottom-3 rounded-full bg-zinc-900/80 px-2 py-1 text-[0.68rem] tracking-[0.04em] text-white uppercase">
            2.35× detail
          </span>
        </InLens.Panel>

        <figcaption className="absolute right-3 bottom-3 rounded-md border border-zinc-200 bg-white/90 px-2.5 py-1.5 text-xs text-zinc-500 backdrop-blur-sm max-[560px]:hidden">
          Move over the image to inspect details
        </figcaption>
      </InLens.Root>
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const productId = parseProductId(slug);
  if (!productId) notFound();

  const product = await getProduct(productId);
  if (!product) notFound();

  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

  return (
    <main className="min-h-screen">
      <header className="grid min-h-17 grid-cols-[1fr_auto] items-center justify-center gap-6 bg-zinc-900 px-[clamp(20px,4vw,64px)] py-3 text-zinc-50 min-[821px]:grid-cols-[auto_minmax(240px,680px)_auto]">
        <Link
          href="/products/1/essence-mascara-lash-princess"
          className="text-lg font-extrabold tracking-[-0.04em] no-underline"
        >
          Northstar
        </Link>
        <div
          className="hidden justify-between rounded-lg border border-zinc-700 bg-white px-3 py-2.5 text-zinc-500 min-[821px]:flex"
          aria-hidden="true"
        >
          Search the catalog
          <span className="text-lg text-zinc-900">⌕</span>
        </div>
        <span className="text-sm font-semibold whitespace-nowrap">Cart · 0</span>
      </header>

      <div className="mx-auto w-[min(1480px,calc(100%_-_40px))] py-5.5 pb-16 max-[560px]:w-[min(1480px,calc(100%_-_24px))]">
        <nav
          className="mb-7 flex flex-wrap gap-2 text-xs text-zinc-500 capitalize"
          aria-label="Breadcrumb"
        >
          <Link className="no-underline" href="/">
            Catalog
          </Link>
          <span>/</span>
          <span>{product.category.replaceAll("-", " ")}</span>
          <span>/</span>
          <span>{product.title}</span>
        </nav>

        <section
          className="grid grid-cols-1 items-start gap-[clamp(28px,4vw,64px)] min-[821px]:grid-cols-[minmax(460px,1.1fr)_minmax(320px,.9fr)] min-[1181px]:grid-cols-[minmax(480px,1.25fr)_minmax(320px,.85fr)_260px]"
          aria-labelledby="product-title"
        >
          <ProductMagnifier product={product} />

          <article className="min-w-0">
            <div className="grid justify-items-start gap-3">
              <span className="inline-flex min-h-6 items-center rounded-full border border-zinc-900 px-2.5 py-0.5 text-xs font-semibold">
                {product.brand ?? "Independent"}
              </span>
              <h1
                id="product-title"
                className="m-0 text-[clamp(2rem,3.4vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.055em]"
              >
                {product.title}
              </h1>
              <Stars rating={product.rating} />
            </div>

            <p className="my-6 leading-7 text-zinc-600">{product.description}</p>

            <div className="flex items-baseline gap-3">
              <span className="text-xl font-medium text-red-700">
                -{Math.round(product.discountPercentage)}%
              </span>
              <span className="text-4xl tracking-[-0.04em]">
                <sup className="text-sm">$</sup>
                {discountedPrice.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 mb-0 text-xs text-zinc-500 line-through">
              List price: ${product.price.toFixed(2)}
            </p>

            <div className="my-6 h-px bg-zinc-200" />

            <dl className="m-0 grid gap-3.5 text-sm [&>div]:grid [&>div]:grid-cols-[100px_1fr] [&>div]:gap-3 [&_dt]:text-xs [&_dt]:text-zinc-500 [&_dd]:m-0 [&_dd]:font-medium">
              <div>
                <dt>SKU</dt>
                <dd>{product.sku}</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>{product.availabilityStatus}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{product.shippingInformation}</dd>
              </div>
              <div>
                <dt>Returns</dt>
                <dd>{product.returnPolicy}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Product tags">
              {product.tags.map((tag) => (
                <span
                  className="inline-flex min-h-6 items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>

          <aside className="grid gap-3.5 rounded-xl border border-zinc-200 bg-white p-5 text-sm shadow-xs min-[821px]:col-start-2 min-[1181px]:col-auto">
            <p className="m-0 text-2xl">${discountedPrice.toFixed(2)}</p>
            <p className="m-0 leading-6">
              FREE delivery. <strong>{product.shippingInformation}</strong>
            </p>
            <p className="m-0 text-base font-semibold text-green-700">
              {product.stock > 0 ? "In stock" : "Currently unavailable"}
            </p>
            <label className="-mb-2 text-xs font-semibold" htmlFor="quantity">
              Quantity
            </label>
            <select
              className="min-h-9 rounded-md border border-zinc-200 bg-white px-2.5"
              id="quantity"
              defaultValue="1"
            >
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
            <button
              type="button"
              className="min-h-10 cursor-pointer rounded-lg border border-zinc-900 bg-zinc-900 text-sm font-semibold text-white"
            >
              Add to cart
            </button>
            <button
              type="button"
              className="min-h-10 cursor-pointer rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-900"
            >
              Buy now
            </button>
            <small className="leading-6 text-zinc-500">{product.warrantyInformation}</small>
          </aside>
        </section>

        {product.reviews[0] ? (
          <section
            className="mt-16 grid grid-cols-1 gap-8 rounded-xl border border-zinc-200 bg-white p-[clamp(24px,4vw,44px)] shadow-xs min-[821px]:grid-cols-[minmax(240px,.6fr)_1fr]"
            aria-labelledby="review-title"
          >
            <div>
              <span className="text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">
                Top review
              </span>
              <h2
                id="review-title"
                className="mt-2 mb-0 text-[clamp(1.55rem,3vw,2.4rem)] tracking-[-0.04em]"
              >
                What customers noticed
              </h2>
            </div>
            <blockquote className="m-0 text-lg leading-7 text-zinc-700">
              “{product.reviews[0].comment}”
              <cite className="mt-3 block text-xs not-italic text-zinc-500">
                — {product.reviews[0].reviewerName}
              </cite>
            </blockquote>
          </section>
        ) : null}
      </div>
    </main>
  );
}
