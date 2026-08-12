# InLens data-table example

A dense App Router Server Component backed by DummyJSON's built-in users dataset. The users API is
used instead of the custom-response tool because its nested company, address, role, and contact
fields make a better realistic table fixture.

The full HTML table is repeated inside a following lens and a separate inspection panel. InLens
magnifies real table markup—not a screenshot or canvas—while all layout remains in consumer CSS.
The table, cards, badges, and responsive shell use Tailwind CSS v4 utilities.

The route composes the complete `InLens.*` compound API directly in a Server Component. The fetched
records and repeated table markup remain server-rendered children; only InLens's private runtime
hydrates pointer and measurement behavior.

```bash
npm run dev -w nextjs-app-router-data-magnify
```
