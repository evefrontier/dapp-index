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
