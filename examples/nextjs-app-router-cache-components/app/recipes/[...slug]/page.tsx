import { InLens } from "@inlens/next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface RecipeSummary {
  id: number;
  name: string;
  image: string;
  cuisine: string;
  difficulty: string;
  rating: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
}

interface Recipe extends RecipeSummary {
  ingredients: string[];
  instructions: string[];
  servings: number;
  caloriesPerServing: number;
  tags: string[];
  reviewCount: number;
  mealType: string[];
}

interface RecipesResponse {
  recipes: RecipeSummary[];
}

function parseRecipeId(slug: string[]): number | null {
  const id = slug.find((part) => /^\d+$/.test(part));
  if (!id) return null;

  const parsed = Number(id);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function RecipeImage({ recipe }: { recipe: RecipeSummary }) {
  return (
    <InLens.Root zoom={2.6} className="group/inlens relative m-0 aspect-4/3 w-full touch-none">
      <InLens.Image className="absolute inset-0 overflow-hidden rounded-[28px_6px_28px_6px] bg-[#e7e1d5] shadow-[0_24px_64px_rgb(37_38_31/14%)]">
        <Image
          className="object-cover"
          src={recipe.image}
          fill
          loading="eager"
          sizes="(max-width: 900px) 92vw, 720px"
          alt={recipe.name}
        />
      </InLens.Image>

      <InLens.Tracker className="inlens-follow invisible absolute top-0 left-0 z-4 h-(--inlens-height) w-(--inlens-width) rounded-full border-2 border-[#fffcf6] bg-[#fffcf6]/20 outline outline-[#51624b] pointer-events-none group-data-[inlens-state=active]/inlens:visible" />
      <InLens.Panel
        as="aside"
        className="invisible absolute -right-6.5 -bottom-6.5 z-5 aspect-square w-[42%] overflow-hidden rounded-full border-[7px] border-[#fffcf6] bg-[#ddd5c6] shadow-[0_18px_44px_rgb(37_38_31/22%)] pointer-events-none group-data-[inlens-state=active]/inlens:visible max-[620px]:right-3 max-[620px]:bottom-3"
      >
        <InLens.Magnified className="inlens-magnified">
          <Image className="object-cover" src={recipe.image} fill sizes="1900px" alt="" />
        </InLens.Magnified>
        <span className="absolute right-1/2 bottom-3 w-max translate-x-1/2 rounded-full bg-[#25261f]/75 px-2 py-1 text-[0.58rem] text-[#fffcf6] uppercase">
          Ingredient detail · 2.6×
        </span>
      </InLens.Panel>
    </InLens.Root>
  );
}

async function CachedRecipe({ recipeId }: { recipeId: number }) {
  "use cache";
  cacheLife("hours");
  cacheTag("recipes", `recipe-${recipeId}`);

  const fields = [
    "id",
    "name",
    "image",
    "cuisine",
    "difficulty",
    "rating",
    "prepTimeMinutes",
    "cookTimeMinutes",
  ].join(",");
  const [recipeResponse, relatedResponse] = await Promise.all([
    fetch(`https://dummyjson.com/recipes/${recipeId}`),
    fetch(`https://dummyjson.com/recipes?limit=6&select=${encodeURIComponent(fields)}`),
  ]);

  if (recipeResponse.status === 404) notFound();
  if (!recipeResponse.ok || !relatedResponse.ok) {
    throw new Error("DummyJSON could not load the cached recipe view.");
  }

  const recipe = (await recipeResponse.json()) as Recipe;
  const relatedData = (await relatedResponse.json()) as RecipesResponse;
  const related = relatedData.recipes.filter((item) => item.id !== recipe.id).slice(0, 3);
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <>
      <article
        className="grid grid-cols-1 items-center gap-[clamp(40px,7vw,96px)] min-[901px]:grid-cols-[minmax(440px,1.15fr)_minmax(320px,.85fr)]"
        aria-labelledby="recipe-title"
      >
        <RecipeImage recipe={recipe} />

        <div className="pt-6 min-[901px]:pt-0">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex w-max items-center rounded-full border border-[#51624b] px-2.5 py-1 font-mono text-[0.65rem] font-semibold text-[#51624b]">
              {recipe.cuisine}
            </span>
            <span className="inline-flex w-max items-center rounded-full border border-[#75776b] px-2.5 py-1 font-mono text-[0.65rem] font-semibold text-[#75776b]">
              {recipe.difficulty}
            </span>
          </div>
          <h1
            id="recipe-title"
            className="my-4 max-w-162.5 font-serif text-[clamp(3rem,6vw,6.4rem)] leading-[0.9] font-medium tracking-[-0.065em]"
          >
            {recipe.name}
          </h1>
          <p className="max-w-140 font-serif text-lg leading-7 text-[#75776b]">
            A cached recipe component composed entirely on the server, with InLens focused on the
            primary food image for a closer look.
          </p>

          <dl className="my-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#dcd7ca] bg-[#dcd7ca] min-[621px]:grid-cols-4 [&>div]:grid [&>div]:gap-1.5 [&>div]:bg-[#fffcf6] [&>div]:p-3.5 [&_dt]:text-[0.65rem] [&_dt]:text-[#75776b] [&_dt]:uppercase [&_dd]:m-0 [&_dd]:text-sm [&_dd]:font-bold">
            <div>
              <dt>Total time</dt>
              <dd>{totalMinutes} min</dd>
            </div>
            <div>
              <dt>Serves</dt>
              <dd>{recipe.servings}</dd>
            </div>
            <div>
              <dt>Calories</dt>
              <dd>{recipe.caloriesPerServing}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{recipe.rating.toFixed(1)} / 5</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 text-xs text-[#c85c32]">
            {recipe.tags.map((tag) => (
              <span key={tag}>#{tag.toLowerCase().replaceAll(" ", "-")}</span>
            ))}
          </div>
        </div>
      </article>

      <div className="mt-[clamp(72px,10vw,140px)] grid grid-cols-1 gap-5 min-[901px]:grid-cols-[minmax(280px,.7fr)_minmax(420px,1.3fr)]">
        <section
          className="relative rounded-[14px] border border-[#dcd7ca] bg-[#fffcf6] p-[clamp(24px,4vw,44px)] shadow-[0_10px_34px_rgb(37_38_31/5%)]"
          aria-labelledby="ingredients-title"
        >
          <span className="absolute top-4.5 right-5 font-serif text-5xl text-[#c7c1b4]">01</span>
          <h2
            className="mt-0 mb-7 font-serif text-[clamp(2rem,4vw,3.6rem)] font-medium tracking-tighter"
            id="ingredients-title"
          >
            Ingredients
          </h2>
          <ul className="m-0 grid list-none gap-0 p-0">
            {recipe.ingredients.map((ingredient) => (
              <li
                className="grid grid-cols-[10px_1fr] items-start gap-3 border-t border-[#dcd7ca] py-3.5 text-sm leading-6 text-[#4d4f45]"
                key={ingredient}
              >
                <span className="mt-1.5 size-2 rounded-full bg-[#c85c32]" aria-hidden="true" />
                {ingredient}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="relative rounded-[14px] border border-[#dcd7ca] bg-[#fffcf6] p-[clamp(24px,4vw,44px)] shadow-[0_10px_34px_rgb(37_38_31/5%)]"
          aria-labelledby="method-title"
        >
          <span className="absolute top-4.5 right-5 font-serif text-5xl text-[#c7c1b4]">02</span>
          <h2
            className="mt-0 mb-7 font-serif text-[clamp(2rem,4vw,3.6rem)] font-medium tracking-tighter"
            id="method-title"
          >
            Method
          </h2>
          <ol className="m-0 grid list-none gap-0 p-0">
            {recipe.instructions.map((instruction, index) => (
              <li
                className="grid grid-cols-[44px_1fr] gap-4 border-t border-[#dcd7ca] py-4.5"
                key={instruction}
              >
                <span className="font-mono text-xs text-[#c85c32]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="m-0 leading-7 text-[#4d4f45]">{instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-[clamp(72px,10vw,140px)]" aria-labelledby="related-title">
        <header className="mb-6 flex flex-col items-start justify-between gap-8 min-[621px]:flex-row min-[621px]:items-end">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.12em] text-[#c85c32] uppercase">
              From the same cached collection
            </p>
            <h2
              id="related-title"
              className="m-0 font-serif text-[clamp(2rem,4vw,3.6rem)] font-medium tracking-tighter"
            >
              Cook something else
            </h2>
          </div>
          <span className="text-xs text-[#75776b]">{recipe.reviewCount} notes on this recipe</span>
        </header>

        <div className="grid grid-cols-1 gap-4.5 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
          {related.map((item) => (
            <article
              className="overflow-hidden rounded-xl border border-[#dcd7ca] bg-[#fffcf6]"
              key={item.id}
            >
              <div className="relative aspect-16/10 w-full overflow-hidden bg-[#e7e1d5]">
                <Image
                  className="object-cover"
                  src={item.image}
                  fill
                  sizes="(max-width: 720px) 92vw, 360px"
                  alt={item.name}
                />
              </div>
              <div className="p-4.5">
                <span className="text-xs text-[#75776b]">
                  {item.cuisine} · {item.prepTimeMinutes + item.cookTimeMinutes} min
                </span>
                <h3 className="my-2 font-serif text-2xl leading-6 tracking-[-0.035em]">
                  <Link className="no-underline" href={`/recipes/${item.id}/${slugify(item.name)}`}>
                    {item.name}
                  </Link>
                </h3>
                <p className="m-0 text-xs text-[#75776b]">
                  {item.difficulty} · {item.rating.toFixed(1)} / 5
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

async function RecipeRoute({ params }: { params: PageProps<"/recipes/[...slug]">["params"] }) {
  const { slug } = await params;
  const recipeId = parseRecipeId(slug);
  if (!recipeId) notFound();

  return <CachedRecipe recipeId={recipeId} />;
}

function RecipeSkeleton() {
  return (
    <div
      className="grid min-h-155 grid-cols-1 items-center gap-18 min-[901px]:grid-cols-[1.15fr_.85fr]"
      aria-label="Loading recipe"
    >
      <div className="aspect-4/3 rounded-[28px_6px_28px_6px] bg-[#e7e1d5]" />
      <div className="grid gap-4.5">
        <span className="block h-7 w-[45%] rounded-md bg-[#e7e1d5]" />
        <span className="block h-32.5 w-[90%] rounded-md bg-[#e7e1d5]" />
        <span className="block h-7 w-[72%] rounded-md bg-[#e7e1d5]" />
      </div>
    </div>
  );
}

export default function RecipePage({ params }: PageProps<"/recipes/[...slug]">) {
  return (
    <main className="min-h-screen">
      <header className="grid min-h-18 grid-cols-[1fr_auto] items-center gap-10 border-b border-[#dcd7ca] bg-[#fffcf6]/90 px-[clamp(20px,5vw,72px)] py-3 backdrop-blur-md min-[621px]:grid-cols-[auto_1fr_auto]">
        <Link
          href="/recipes/1/classic-margherita-pizza"
          className="font-serif text-xl font-bold tracking-[-0.03em] no-underline"
        >
          Pantry Notes
        </Link>
        <nav
          className="hidden gap-6 text-sm text-[#75776b] min-[621px]:flex"
          aria-label="Primary navigation"
        >
          <span>Recipes</span>
          <span>Techniques</span>
          <span>Collections</span>
        </nav>
        <span className="inline-flex w-max items-center rounded-full border border-[#51624b] bg-[#eff4eb] px-2.5 py-1 font-mono text-[0.65rem] font-semibold text-[#51624b]">
          use cache · hours
        </span>
      </header>

      <div className="mx-auto w-[min(1320px,calc(100%-40px))] py-[clamp(36px,7vw,88px)] pb-20 max-[620px]:w-[min(1320px,calc(100%-24px))]">
        <Suspense fallback={<RecipeSkeleton />}>
          <RecipeRoute params={params} />
        </Suspense>
      </div>
    </main>
  );
}
