# Move Registry Package Agent Guide

## Scope

- Applies to the Sui Move package in `registry/move/`.
- This package stores compact listing records and metadata pointers; rich metadata belongs in Walrus.

## Commands

- From the repo root:
  - `bun run move:build`
  - `bun run move:test`
- From this directory:
  - `sui move build`
  - `sui move test`

## Expectations

- Keep public function changes synchronized with frontend transaction builders and docs.
- Add Move tests for authorization, slug/category validation, metadata URI/hash validation, and event behavior.
- Do not introduce publish, upgrade, or mainnet transaction automation without explicit user approval.
- If storage layout or public APIs change, update `docs/MOVE_PUBLISH.md` and builder-facing docs.
