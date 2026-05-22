# Metadata Schema Agent Guide

## Scope

- Applies to JSON schema and builder metadata validation under `registry/schema/`.
- Public metadata changes affect Walrus payloads, frontend rendering, builder UX, and governance.

## Commands

- From the repo root:
  - `bun run site:test`
  - `bun run site:typecheck`

## Expectations

- Schema changes need matching TypeScript type updates and validation tests.
- Avoid duplicate sources of truth. If runtime validation mirrors schema patterns, add drift tests.
- Do not keep legacy metadata fields unless the user explicitly requests backward compatibility.
- Document public metadata changes in `docs/BUILDER_PLAN.md` or a focused metadata doc.
