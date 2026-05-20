# Codex PR Review Prompt

Review this pull request for serious issues only.

## Context

This repository owns the EVE Frontier Dapp Index web app, Sui Move registry package, builder metadata schema, Walrus metadata flow, Move Registry package verification, and governance documentation.

## Instructions

- Do not edit files.
- Inspect the PR diff against the base branch.
- Run lightweight verification commands only when useful and safe.
- Focus on P0/P1 issues: correctness, security, wallet safety, trust/governance regressions, schema compatibility, missing tests for changed behavior, and broken release flows.
- Avoid style nits unless they hide a real bug.
- If you find issues, list findings first with file/line references and severity.
- If no serious issues are found, say that clearly and mention any residual risk or test gap.
- Include a short test/verification summary.

## Repo-specific checks

- Frontend/site changes should be covered by `bun run site:test`, `bun run site:typecheck`, or `bun run site:build`.
- Move changes should be covered by `bun run move:build` and `bun run move:test`.
- Metadata schema changes should include TypeScript type updates, validation tests, and docs updates.
- Public metadata changes should avoid duplicate sources of truth and should not keep legacy fields unless explicitly required.
