# Dapp Index Agent Guide

## Tool Compatibility

- This file is the canonical shared instruction source for AI coding agents.
- Codex reads `AGENTS.md` directly.
- GitHub Copilot can use `AGENTS.md`; `.github/copilot-instructions.md` also points Copilot chat/review surfaces back to this file.
- Claude Code reads `CLAUDE.md`, which imports this file.
- Gemini CLI reads `GEMINI.md`, which imports this file.
- Cursor reads `.cursor/rules/dapp-index.mdc`, which points back to this file and repeats the highest-priority rules.
- Windsurf reads `AGENTS.md` directly through its rules engine.
- Keep tool-specific behavior in adapter files or workflow prompts instead of duplicating full instructions.

## Project Shape

- This repo owns the Dapp Index web app, Sui Move registry package, builder metadata schema, Walrus metadata flow, and index governance docs.
- Keep Move, Walrus metadata, MVR verification, frontend UI, and docs changes reviewable as separate surfaces.
- Prefer small branches from `main`. This workspace uses the `codex/` prefix for Codex-generated branches.

## Working Rules

- Protect user work. Never revert unrelated changes or run destructive git commands unless explicitly asked.
- Read the relevant docs before changing architecture: `README.md`, `docs/BUILDER_PLAN.md`, and any scoped `AGENTS.md`.
- Use existing repo patterns before adding abstractions or dependencies.
- Ask before adding production dependencies, new services, or automatic deploy/publish behavior — see the dependency policy below for the bar a new dependency needs to clear.
- Sui package publishing, mainnet-facing release steps, and wallet-funded transactions stay manual unless the user explicitly asks otherwise.

## Dependency & supply-chain policy

Every dependency — an npm/bun package or a GitHub Action in `.github/workflows/*.yml` — is a supply-chain liability, not just a convenience. Default to fewer of them.

- **Default to zero new dependencies.** Before adding one, check whether an already-used dependency, the standard library, or a short first-party script (`git diff`, plain `bash`, a small `.cjs`/`.ts` helper invoked via `actions/github-script`) already covers the need.
- **Prefer first-party over third-party.** In CI that means official `actions/*` steps, the platform vendor's own action (e.g. `oven-sh/setup-bun`), or plain shell — before a community action that just wraps the same shell command or API call.
- **When a third-party dependency is genuinely justified**, only accept ones that are actively maintained (recent releases/commits, responsive to issues) and widely adopted (large install base, used by many other serious projects) — not a single-maintainer or stale package doing something trivial.
- Prefer swapping an existing third-party action for an official action or a short inline script when it doesn't add real complexity (e.g. `dorny/paths-filter` → a plain `git diff --name-only` gate; `peter-evans/find-comment` + `peter-evans/create-or-update-comment` → one `actions/github-script` step backed by a small `.cjs` helper).
- Don't run an uninvited dependency-removal sweep. Apply this policy when touching a workflow or dependency for another reason, or when explicitly asked to reduce the dependency surface.

## PR discipline

Optimize for reviewability over delivery speed. A PR should answer one clear question: what behavior or contract changed, and can a reviewer verify that in isolation?

### Scope

- One concern per PR. Separate Move, metadata/schema, frontend, Walrus flow, and docs unless the change is trivially coupled.
- Prefer small diffs. If a change spans multiple layers or surfaces, treat that as a signal to split or stack rather than as normal.
- Stack PRs only when dependency is real. Land foundations before consumers: public contract → persistence → domain logic → UI.
- Do not attach unrelated fixes to an in-flight feature branch because it is convenient.

### Abstractions

- Prefer the simplest code that works. Add helpers when duplication becomes real, not in anticipation of future use.
- Extract shared logic only when at least two production call sites need it, or when defining an intentional module boundary.
- Do not export symbols for a future PR. If nothing in production uses it yet, keep it local or wait until the consumer exists.
- One rule, one place. Validation, formatting, and normalization should have a single source of truth; compose from it rather than re-expressing the same rule in another layer.
- Validate at boundaries (user action, storage write, publish/submit). Inner layers should trust validated input unless security requires otherwise.

### Before opening a PR

- Scan the diff: does it stay within one surface and one behavioral goal?
- Scan new exports: does each one have a production consumer?
- Scan for repeated logic: the same check or formatter in multiple modules is usually a design smell, not acceptable duplication.
- State what was deferred, what surfaces changed, and which verification commands ran.

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
- Flag duplicate helpers, speculative exports, and multi-surface PRs without a split plan.
- Flag new third-party dependencies (packages or GitHub Actions) that skip the dependency & supply-chain policy above — no justification, an unmaintained/narrow package, or a case where a first-party alternative would do.
