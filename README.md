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

## Planned Layout

```text
dapp-index/
  site/
  registry-move/
  docs/