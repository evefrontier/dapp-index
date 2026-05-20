# Dapp Index Agent Guide

## Project Shape

- This repo owns the Dapp Index web app, Sui Move registry package, builder metadata schema, Walrus metadata flow, and index governance docs.
- Keep Move, Walrus metadata, MVR verification, frontend UI, and docs changes reviewable as separate surfaces.
- Prefer small branches from `main` with the `codex/` prefix.

## Working Rules

- Protect user work. Never revert unrelated changes or run destructive git commands unless explicitly asked.
- Read the relevant docs before changing architecture: `README.md`, `docs/BUILDER_PLAN.md`, and any scoped `AGENTS.md`.
- Use existing repo patterns before adding abstractions or dependencies.
- Ask before adding production dependencies, new services, or automatic deploy/publish behavior.
- Sui package publishing, mainnet-facing release steps, and wallet-funded transactions stay manual unless the user explicitly asks otherwise.

## Verification Matrix

- Frontend or site utilities: `bun run site:test`, `bun run site:typecheck`, and `bun run site:build`.
- Registry schema or metadata validation: `bun run site:test` plus docs updates when public metadata changes.
- Sui Move registry package: `bun run move:build` and `bun run move:test`.
- Cross-surface changes: `bun run ci`.
- Docs-only changes: inspect links/commands touched and state that code tests were not run.

## Review Guidelines

- Prioritize correctness, trust, governance, schema compatibility, wallet safety, and missing tests.
- For PR review, flag serious issues first with file and line references.
- Check that public schema/type changes include tests and docs.
- Check that generated PR descriptions list affected surfaces and commands run.
