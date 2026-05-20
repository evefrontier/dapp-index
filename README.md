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

## AI Agent Automation

This repo includes shared agent guidance and reusable prompts for assisted
development, review, docs checks, and release-readiness sweeps. Codex is the
first configured GitHub review path, but the repo also includes adapters for
GitHub Copilot, Claude Code, Gemini CLI, and Cursor. Windsurf can read the
shared `AGENTS.md` instructions directly.

Start with [docs/AGENT_AUTOMATION.md](docs/AGENT_AUTOMATION.md) and the root
`AGENTS.md` before delegating work to an AI coding agent.

## Planned Layout

```text
dapp-index/
  site/
  registry/
    move/
    schema/
  docs/
  .github/
  .cursor/
  AGENTS.md
  CLAUDE.md
  GEMINI.md
```
