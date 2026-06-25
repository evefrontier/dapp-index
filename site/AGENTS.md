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

## TypeScript conventions

Follow these in domain logic, chain helpers, and builder modules — not just UI.

### Avoid trivial helpers

Do not add functions whose body is shorter than their name unless they are reused or encode a real domain concept.

Common anti-patterns to avoid:

- **One-liner wrappers** — e.g. `normalizedAddress(x) { return x.trim().toLowerCase(); }` used once. Inline the expression at the call site.
- **Passthrough re-exports** — e.g. `createSchemaPublishIssues(v) { return createSchemaValidationIssues(v); }`. Call the existing helper directly.
- **Predicate aliases** — e.g. `isImageMediaAsset(a) { return a.media.kind === 'screenshot'; }` used only in one `.filter()`. Put the condition inline.
- **Optional-field spread helpers** — e.g. `optionalCaption(caption)` returning `{ caption } | {}`. Use `const value = x?.trim(); ...(value ? { caption: value } : {})` at the call site unless the pattern is repeated many times.
- **Reimplementing dependencies** — prefer existing SDK utilities (e.g. `fromHex` from `@mysten/sui/utils`) over hand-rolled parsers in `src/`.

Extract a helper when it:

- Is called from **two or more** places,
- Names a **non-obvious domain rule** (poster selection priority, publish readiness ordering),
- Or **composes** several steps into one readable unit (`buildMediaGallery`, transaction builders).

### Discriminated unions and readiness checks

- Use **`switch` + `assertNever`** on typed status unions in domain logic — not only in UI copy. This keeps exhaustiveness checking when new statuses are added.
- For ordered blocker or readiness lists, prefer a **declarative array** of `condition && message` entries filtered to strings over sequential `if (!x) blockers.push(...)` chains. Preserve order when the first blocker is shown to users.

### Exports and tests

- Export only what other **production** code needs. Tests are not a reason to keep a public helper alive.
- Do not add **test-only utilities under `src/`**. Use `site/test/` helpers or test behavior through the module boundary callers actually use.
- Do not add tests that only assert a thin wrapper around a library or existing helper works.
- After refactors, remove helpers and exports that no longer have production callers.
