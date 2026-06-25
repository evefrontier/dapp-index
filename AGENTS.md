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
- Prefer small branches from `main`. See **Git and GitHub conventions** below for branch names, commits, and PR descriptions.

## Working Rules

- Protect user work. Never revert unrelated changes or run destructive git commands unless explicitly asked.
- Read the relevant docs before changing architecture: `README.md`, `docs/BUILDER_PLAN.md`, and any scoped `AGENTS.md`.
- Use existing repo patterns before adding abstractions or dependencies.
- Ask before adding production dependencies, new services, or automatic deploy/publish behavior.
- Sui package publishing, mainnet-facing release steps, and wallet-funded transactions stay manual unless the user explicitly asks otherwise.

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

## Git and GitHub conventions

Follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and mirror the commit **type** in branch names.

### Branches

- Branch from `main`. One concern per branch.
- Name branches `<type>/<short-kebab-description>`.
- **Do not** use tool-specific prefixes such as `codex/`, `cursor/`, or author initials.
- Use the same type vocabulary as commits:

| Type | Branch example | Use for |
| --- | --- | --- |
| `feat/` | `feat/builder-publish-readiness` | New behavior or user-facing capability |
| `fix/` | `fix/slug-check-normalization` | Bug fixes |
| `docs/` | `docs/agent-typescript-conventions` | Documentation-only changes |
| `chore/` | `chore/update-deps` | Maintenance, tooling, repo hygiene |
| `refactor/` | `refactor/publish-domain-helpers` | Behavior-preserving code structure changes |
| `test/` | `test/registration-draft-publish` | Tests only |
| `ci/` | `ci/add-move-cache` | CI/CD workflow changes |
| `build/` | `build/vite-config` | Build system or dependency wiring |
| `perf/` | `perf/registry-listing-query` | Performance improvements |

Other Conventional Commit types (`style:`, etc.) are allowed when they fit.

### Commits

Format:

```text
<type>[optional scope]: <description>

[optional body]
```

Rules:

- **Description** — imperative mood, lowercase start, no trailing period, ~72 characters or less when possible.
- **Scope** — optional noun for the area touched, e.g. `feat(builder):`, `fix(chain):`, `docs(agents):`.
- **Body** — explain *why* when the title is not enough; wrap at ~72 characters.
- **Breaking changes** — append `!` after type/scope or add a `BREAKING CHANGE:` footer.
- Prefer **one logical change per commit**. Split unrelated work instead of mixing surfaces in one commit.

Examples:

```text
feat(builder): add publish readiness blockers

fix(chain): restore isWalrusChainNetwork export

docs(agents): document TypeScript helper conventions

refactor(builder): simplify registration publish domain logic
```

### Pull requests

- Fill out `.github/PULL_REQUEST_TEMPLATE.md`.
- **Summary** — required: what changed and why.
- **Related work** — link stacked PRs, issues, or follow-ups when applicable.
- **Verification** — required: which commands ran and their result. This replaces a separate test plan for most PRs.
- **Manual testing** — only when reviewers need steps CI cannot cover (UI flows, wallet signing, Walrus upload).
- **Do not** add tool attribution lines such as "Made with Cursor" or "Generated by Codex".
- See `CONTRIBUTING.md` → Submitting a pull request for the full checklist.

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
- For site TypeScript, flag **trivial helpers** (one-liner wrappers, passthrough re-exports, test-only `src/` utilities) and **missing exhaustiveness** on discriminated status unions. See `site/AGENTS.md` → TypeScript conventions.
