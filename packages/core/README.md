# `@inlens/core`

Framework-independent InLens geometry and DOM controller. It has no runtime dependencies and is safe to
import during SSR.

```ts
import { createMagnifierController, computeLensPosition } from "@inlens/core";

const controller = createMagnifierController({
  container: document.querySelector("#surface")!,
});
```

The controller coalesces pointer moves and active scroll into one RAF stream, measures once per
publication, ignores touch pointers, and provides complete idempotent cleanup. It owns pointer behavior
only. The React runtime observes component border boxes, while Core owns the geometry calculations that
turn those measurements into output coordinates. See the repository README for the complete API and
numeric contract.
