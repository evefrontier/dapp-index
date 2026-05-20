# Codex Docs Drift Review Prompt

Check whether repository documentation has drifted from code and configuration.

## Inspect

- `README.md`
- `docs/BUILDER_PLAN.md`
- `docs/MOVE_PUBLISH.md`
- `docs/CODEX_AUTOMATION.md`
- `package.json`
- `site/package.json`
- `registry/schema/registry-entry.schema.json`
- `registry/move/README.md`

## Output

- List stale or contradictory docs with file references.
- Suggest the smallest documentation edits needed.
- Do not edit files unless the task explicitly asks for a patch.
- If docs match the current code, say so and include commands or files inspected.
