# Codex Automation Playbook

This playbook explains how to use Codex safely in the EVE Frontier Dapp Index
repo. The goal is to make common work repeatable while keeping Sui publishing,
wallet-funded actions, and governance decisions human-controlled.

## What Codex Should Automate First

- Repo understanding: summarize architecture, affected files, and risks.
- Verification: run the smallest relevant command set and report exact output.
- PR review: look for serious issues before human review.
- Docs drift: compare docs, schema, Move package, and site behavior.
- Draft implementation: create small branches with tests and PR descriptions.

Codex should not automatically publish Sui packages, pay for transactions,
merge PRs, or change governance/release policy without explicit approval.

## Command Matrix

Run commands from the repository root.

| Surface | Commands |
| --- | --- |
| Site / frontend | `bun run site:test`, `bun run site:typecheck`, `bun run site:build` |
| Metadata schema | `bun run site:test`, `bun run site:typecheck` |
| Sui Move registry | `bun run move:build`, `bun run move:test` |
| Cross-surface change | `bun run ci` |
| Docs only | inspect changed links and commands; explain if code checks were skipped |

## Common Codex Tasks

### Review a PR

Use the GitHub comment:

```text
@codex review
```

For a focused review:

```text
@codex review for schema drift and trust/governance regressions
```

Codex should read `AGENTS.md`, inspect the diff, run lightweight checks when
useful, and report only serious findings.

### Fix CI

Prompt:

```text
Investigate the failing CI checks on this branch. Reproduce the failure locally,
make the smallest safe fix, rerun the failing command, and summarize the result.
```

Expected output:

- failing command;
- root cause;
- changed files;
- verification command and result.

### Update Builder Metadata Schema

Prompt:

```text
Update the builder metadata schema for <field/behavior>. Keep schema,
TypeScript types, runtime validation, tests, and builder docs in sync. Do not
keep backward compatibility unless explicitly requested.
```

Expected checks:

- `bun run site:test`
- `bun run site:typecheck`

### Add Walrus Media Validation

Prompt:

```text
Add Walrus media validation for <screenshots/videos/metadata>. Keep upload
draft behavior separate from final Walrus upload and Sui registration.
```

Expected checks:

- storage or validation tests;
- `bun run site:typecheck`;
- docs update if public metadata changes.

### Add MVR Verification Logic

Prompt:

```text
Add or update MVR package verification. Verify MVR name resolution against the
declared package ID, avoid duplicate package-maintainer metadata, and add tests
for mismatch, missing, and unreachable states.
```

Expected checks:

- `bun run site:test`
- `bun run site:typecheck`

### Update Move Registry Functions

Prompt:

```text
Update the Sui Move registry package for <behavior>. Keep public function names,
frontend transaction builders, tests, and docs synchronized.
```

Expected checks:

- `bun run move:build`
- `bun run move:test`
- frontend transaction builder tests when calls change.

### Draft a PR Description

Prompt:

```text
Write a PR description for this branch. Include summary, affected surfaces,
test plan, trust/governance notes, and manual release steps.
```

### Generate Docs From Merged Changes

Prompt:

```text
Review changes merged since <commit/tag/date> and update README, builder plan,
Move publish docs, and Codex automation docs where they drift from code.
```

## GitHub Automation

This repo includes:

- `.github/workflows/ci.yml` for site and Move checks;
- `.github/workflows/codex-review.yml` for Codex PR review comments;
- `.github/codex/prompts/` for reusable Codex review prompts.

The Codex review workflow requires `OPENAI_API_KEY` as a GitHub secret. It is
designed for review comments, not automatic fixes or merges.

## Suggested Recurring Automations

Start these manually in Codex first. Schedule only after the prompt produces
useful output.

### Weekly Docs And Schema Drift

Cadence: weekly.

Prompt:

```text
Check README, docs/BUILDER_PLAN.md, docs/MOVE_PUBLISH.md, docs/CODEX_AUTOMATION.md,
registry/schema/registry-entry.schema.json, registry/move/README.md, and package
scripts for drift. Report stale or contradictory docs. Do not edit files unless
there is a small, obvious docs-only fix.
```

### Weekly Dependency And Build Health

Cadence: weekly.

Prompt:

```text
Run the repository verification matrix where possible. Report failing commands,
warnings, dependency/tooling risks, and suggested follow-up issues. Do not update
dependencies automatically.
```

### Release Readiness Before Mainnet-Facing Changes

Cadence: manual or before tagged releases.

Prompt:

```text
Prepare a release-readiness checklist for this branch. Include affected surfaces,
commands run, manual Sui/Walrus/MVR steps, governance risks, and go/no-go notes.
```

## Safety Defaults

- Codex-generated implementation branches should start from `main`.
- Use worktrees for unattended or recurring automation.
- Keep internet access limited unless current external docs are required.
- Keep secrets out of the agent phase where possible.
- Review the first few automation outputs before enabling recurring schedules.
