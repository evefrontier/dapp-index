---
name: docs-drift-review
description: Check whether dapp-index's documentation has drifted from the current code and configuration (README, AGENTS.md, CLAUDE.md, GEMINI.md, .cursor rules, docs/, package.json files, registry schema). Lists stale or contradictory docs with file references and suggests the smallest fix. Use when auditing documentation freshness, before a release, or after a change that touches config/schema/automation.
---

# Docs and Agent Drift Review

Check whether repository documentation has drifted from code and configuration.

## Inspect

- `README.md`
- `docs/BUILDER_PLAN.md`
- `docs/MOVE_PUBLISH.md`
- `docs/AGENT_AUTOMATION.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.cursor/rules/dapp-index.mdc`
- `package.json`
- `site/package.json`
- `registry/schema/registry-entry.schema.json`
- `registry/move/README.md`

## Output

- List stale or contradictory docs with file references.
- Suggest the smallest documentation edits needed.
- Do not edit files unless the task explicitly asks for a patch.
- If docs match the current code, say so and include commands or files inspected.
