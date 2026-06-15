# Site Agent Guide

## Scope

- Applies to the Vite/React/TypeScript app in `site/`.
- Use the repo design language already present in `site/src/index.css` and the vendored `@evefrontier/ui` package.

## Commands

- From the repo root:
  - `bun run site:test`
  - `bun run site:typecheck`
  - `bun run site:build`
- From `site/`:
  - `bun test`
  - `bun run typecheck`
  - `bun run build`

## Expectations

- Builder media slots use stable draft media ids (`logo`, `thumbnail`, `gallery-1`, …). There is no migration for older flat-list local drafts; clear browser local draft storage when the media slot model changes during development.
- Keep chain, Walrus, metadata, and UI concerns separated.
- Add or update tests for schema validation, transaction builders, storage helpers, and trust/gating logic.
- Browser-only APIs such as IndexedDB should have injectable adapters so unit tests can run under Bun.
- Do not hide build warnings in final notes; report them if they remain.

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
