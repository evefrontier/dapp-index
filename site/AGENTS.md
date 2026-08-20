# Site Agent Guide

## Scope

- Applies to the Vite/React/TypeScript app in `site/`.
- Use the repo design language already present in `site/src/index.css` and the vendored `@evefrontier/ui` package.

## Commands

- From the repo root:
  - `bun run site:test`
  - `bun run site:typecheck`
  - `bun run site:build`
  - `bun run site:e2e` (Playwright visual regression; run `site:build` first)
- From `site/`:
  - `bun test`
  - `bun run typecheck`
  - `bun run build`
  - `bun run e2e` / `bun run e2e:update`

## Visual regression (`e2e/`)

- Playwright specs live in `site/e2e/specs/**/*.e2e.ts` and are separate from the Bun unit tests in `site/test/`. They render the production build via `vite preview`, so **build before running**: `bun run site:build && bun run site:e2e`.
- Specs use the `.e2e.ts` suffix (not `.spec.ts`/`.test.ts`) on purpose: `bun test` matches `*.spec.ts`/`*.test.ts` by default and would otherwise try to execute Playwright files too. `playwright.config.ts` sets `testMatch: '**/*.e2e.ts'` to match. Keep new e2e specs on this suffix.
- `smoke.e2e.ts` asserts structure (headings, nav, seeded wizard). `showcase.e2e.ts` captures `toHaveScreenshot` baselines for the index, builder home, and wizard steps.
- Seed builder state with `e2e/fixtures/draftSeed.ts` (writes the real `DRAFT_STORAGE_KEY`); stabilize rendering and mask RPC-dependent regions with `e2e/fixtures/stablePage.ts`.
- **Only Linux baselines are committed** (`…-chromium-linux.png`), matching the Ubuntu CI runner. macOS/Windows baselines are gitignored — treat local non-Linux runs as a smoke check on spec correctness, not a substitute for the CI gate.
- After an intentional UI change, regenerate Linux baselines and commit them. Do this via CI (download the updated PNGs from a run) or locally with the official Docker image so results match CI's rendering:

  ```bash
  docker run --rm -v "$PWD/..":/work -w /work/site -e HOME=/root \
    mcr.microsoft.com/playwright:v1.61.1-noble bash -lc '
      apt-get update -qq && apt-get install -y -qq unzip
      curl -fsSL https://bun.sh/install | bash -s -- "bun-v1.3.1"
      export PATH="$HOME/.bun/bin:$PATH"
      bun install --frozen-lockfile
      npx playwright test --config e2e/playwright.config.ts --update-snapshots'
  ```

## Expectations

- Builder media slots use stable draft media ids (`logo`, `thumbnail`, `gallery-1`, …). There is no migration for older flat-list local drafts; clear browser local draft storage when the media slot model changes during development.
- Keep chain, Walrus, metadata, and UI concerns separated.
- Add or update tests for schema validation, transaction builders, storage helpers, and trust/gating logic.
- Browser-only APIs such as IndexedDB should have injectable adapters so unit tests can run under Bun.
- Do not hide build warnings in final notes; report them if they remain.

## PR discipline

Follow the repo-wide PR guidance in `AGENTS.md`. For the site app, the main failure mode is shipping a whole vertical slice in one diff: schema, storage, step logic, hooks, screens, styles, and docs together.

### Layering

When a feature crosses layers, prefer a short stack over one large PR:

1. **Public contract** — limits, schemas, metadata rules, and any docs that define the behavior
2. **Persistence** — draft storage, adapters, and write-time normalization
3. **Step/domain logic** — validators and models that express wizard or builder rules
4. **Presentation** — screens, layout, and wiring

Layers may live under different directories (`schemas/`, `storage/`, `builder/`, `chain/`, etc.). The order matters more than the exact folder layout.

### Shared logic

- **Controllers and hooks orchestrate.** They coordinate state, side effects, and errors. They should not re-implement rules that already belong in schemas, validators, or storage.
- **Schemas define rules.** Step validation and persistence checks should derive from the same definitions, not duplicate them in prose or ad hoc conditionals.
- **Write paths stay consistent.** If one code path normalizes or trims a field on update, every create/update path must follow the same rule.
- **User-facing numbers match the contract.** Displayed limits and labels must use the same units and semantics as the constants and docs that define them.

### Exports and tests

- Export only what other production code needs. Tests are not a reason to keep a public helper alive.
- Prefer testing behavior through the module boundary users actually call, rather than maintaining parallel test-only APIs.
- After a refactor, remove code that no longer has callers.
- For unreleased builder flows, prefer clearing local draft storage over migration when the draft shape changes, unless explicitly asked.

## UI conventions

Follow these in site UI code, especially forms and multi-step flows.

### Styling

- Do **not** define reusable CSS class strings as TypeScript constants or helper functions that concatenate utilities.
- Put repeated visual patterns in `site/src/index.css` under `@layer components`. Reuse existing classes before adding new ones.
- Prefer semantic HTML and shared element or component styles in CSS over copying the same typography utilities onto every node.
- Drive visual state from semantic attributes and component state in CSS rather than conditional `className` branches in TSX.
- Use the design-system text scale and tokens. Avoid one-off arbitrary sizes.
- One-off layout utilities in JSX are fine; shared visual language belongs in CSS.

### Forms and validation

- **Zod is the source of truth** for validation and for parsing untyped persisted data. Do not hand-roll type guards when a schema can express the rule.
- Keep **lenient storage parsing** separate from **strict step or submit validation**. Derive both from the same schema definitions where possible.
- Reuse shared schema helpers in `site/src/schemas/` instead of ad hoc decoding in components or storage modules.
- With TanStack Form, validate individual fields and surface errors on the matching control. Avoid form-level validators that collapse multiple issues into one message.
- Keep large screens split into focused components; extract shared presentation into small modules.

### State presentation

- Prefer **`switch` on discriminated status or state** over long `if` chains when mapping enum-like values to labels or copy.
- Branch UI behavior on structured state, not on exact user-facing string literals.
