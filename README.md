# EVE Frontier Dapp Index

EVE Frontier Dapp Index is a standalone product for indexing and discovering Frontier ecosystem dapps, tools, and smart assembly integrations.

This repository is intentionally focused on the Dapp Index product and its registry infrastructure. It is separate from the `evefrontier/dapps` monorepo so ownership, handover, roadmap, and maintainer permissions can evolve independently.

## Scope

This repo owns:

- the Dapp Index web app;
- the Sui Move registry package;
- the builder metadata model;
- the Walrus metadata flow;
- builder-facing documentation;
- index-specific governance and contribution process.

## Source Of Truth

Dapp listings are intended to be registered through the Sui registry and backed by Walrus metadata.

## Codex Automation

This repo includes project guidance and reusable prompts for Codex-assisted
development, review, docs checks, and release-readiness sweeps.

Start with [docs/CODEX_AUTOMATION.md](docs/CODEX_AUTOMATION.md) and the root
`AGENTS.md` before delegating work to Codex.

## Planned Layout

```text
dapp-index/
  site/
  registry/
    move/
    schema/
  docs/
  .github/
  AGENTS.md
```
