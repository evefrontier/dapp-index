---
name: metadata-schema-review
description: Review metadata schema and validation changes in dapp-index. Checks JSON schema/TypeScript type drift, runtime validators that duplicate schema rules, backward compatibility decisions, Walrus metadata payload shape, MVR and package identity fields, and missing validation tests. Use when reviewing changes to registry/schema, metadata validators, or the Walrus metadata flow.
---

# Metadata Schema Review

Review metadata schema and validation changes.

## Focus

- JSON schema and TypeScript type drift.
- Runtime validators that duplicate schema rules.
- Backward compatibility decisions.
- Walrus metadata payload shape.
- MVR and package identity fields.
- Missing validation tests.

## Output

- Findings first, ordered by severity.
- Include exact file/line references.
- State whether docs need an update.
- State which tests should be run before merge.
