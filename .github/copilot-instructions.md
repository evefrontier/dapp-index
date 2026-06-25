# Dapp Index Copilot Instructions

Read `AGENTS.md` before making repo changes. It is the canonical shared source for project architecture, safety rules, verification commands, and review expectations.

Highest-priority reminders:

- Protect user work and never revert unrelated changes.
- Prefer small branches from `main`. Use Conventional Commit branch types (`feat/`, `fix/`, `docs/`, etc.); never `codex/` or `cursor/` prefixes.
- Keep Move, Walrus metadata, MVR verification, frontend UI, and docs changes reviewable as separate surfaces.
- Run the smallest relevant verification commands before claiming completion.
- Do not automate Sui publishing, wallet-funded transactions, mainnet release steps, or governance decisions without explicit approval.
- Read scoped `AGENTS.md` files when working under `site/`, `registry/move/`, or `registry/schema/`.
- In site TypeScript, avoid trivial one-liner helpers and test-only exports from `src/`; see `site/AGENTS.md` → TypeScript conventions.
