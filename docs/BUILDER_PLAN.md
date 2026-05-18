# EVE Frontier Dapp Index Builder Plan

This document explains the current plan for EVE Frontier Dapp Index for builders,
players, and integrators. It is written as a builder-facing architecture decision
log: what we are building, why we chose this shape, and which parts are expected
to evolve later.

## Overview

EVE Frontier Dapp Index is the directory for Frontier ecosystem apps, tools, and
smart assembly integrations.

The first version keeps the contribution path simple. Builders publish their
dapp metadata to Walrus, register the Walrus metadata pointer on Sui, and the
Dapp Index frontend reads from both systems to render verified listings.

Players can browse all listed dapps from one place, or start from a focused
smart assembly view such as Storage unit, Turret, or Gate. Builders can list a
dapp once and have it appear wherever it is relevant.

## Open Source And Builder Collaboration

Dapp Index should be built in the open with Frontier builders, not only for
them. The registry, metadata model, Sui package, Walrus flow, and Dapp Index
frontend should remain open source so builders can inspect the system, propose
changes, and help shape the standards they will use.

GitHub Discussions should be the shared planning space for builder feedback:

- propose metadata fields and validation rules;
- discuss Sui registry changes and approval models;
- share Walrus publishing and metadata hosting needs;
- suggest new index categories and smart assembly facets;
- raise integration issues from real dapp teams before they become permanent
  registry assumptions.

Issues and pull requests can track concrete implementation work, but Discussions
are the better place to gather builder input, compare approaches, and keep the
project direction visible.

## Goal

Dapp Index should make Frontier ecosystem apps easier to find, trust, and
integrate.

For players, the goal is findability: a clear place to find useful dapps for the
Frontier world and the smart assemblies they operate.

For builders, the goal is visibility: a simple, verifiable way to showcase a
brilliant dapp, explain what it does, and connect it to the right Frontier
surfaces.

## User Stories

### Player: Discover Useful Dapps

As a Frontier player, I want to browse dapps in one trusted directory so I can
find tools that help me play, coordinate, build, trade, defend, or manage smart
assemblies.

I should be able to:

- browse all accepted dapps;
- filter by category;
- browse dapps for a specific smart assembly type;
- open the live dapp from its listing;
- understand what the dapp does before leaving the Dapp Index;
- see enough context to decide whether the dapp is relevant and trustworthy.

### Builder: Showcase a Brilliant Dapp

As a Frontier builder, I want to list my dapp in the Dapp Index so players and other
builders can find it, understand it, and open it.

I should be able to:

- create a metadata document that describes my dapp;
- publish that metadata to Walrus;
- register the metadata pointer on Sui;
- update my listing when the dapp changes;
- select categories and smart assembly facets that match my dapp;
- showcase links, Move Registry packages, and integration notes when
  useful.

## Architecture Summary

Dapp Index has two public layers.

The Sui registry is the verifiable index of dapp projects. It stores compact
listing records, ownership, metadata pointers, metadata hashes, high-level
facets, and events.

Walrus stores the full dapp metadata document. This document can include display
copy, screenshots, extended descriptions, integration details, and links that
are too large or too changeable to keep directly in the registry. Package
maintainer/contact metadata belongs in Move Registry package metadata.

The Dapp Index frontend queries Sui for listing records, then fetches and
verifies the referenced Walrus metadata. Any generated local data remains an
implementation fallback while the Sui package and Walrus read flow are being
finalized; it is not the builder-facing plan.

## ADR-001: Use Sui As The Registry Index

Decision: the on-chain registry is the index of dapp projects. Each listing is
keyed by a stable slug and owned by the address that registered it.

Why:

- Sui gives every listing a verifiable owner;
- update and removal rights can be enforced by the registry package;
- registry events can be indexed by Dapp Index clients, search services, and
  downstream tools;
- future governance can build on the same registry object instead of replacing
  the data model.

Implication: Dapp Index clients should treat Sui as the registry source and
Walrus as the metadata source.

## ADR-002: Store Full Dapp Metadata In Walrus

Decision: Sui stores the metadata URI and hash; Walrus stores the full dapp
metadata document.

Why:

- full listing metadata is too large and too changeable to keep directly in the
  registry object;
- Walrus gives builders decentralized storage for rich metadata;
- the on-chain hash lets clients verify that the fetched metadata is the version
  registered by the owner;
- metadata can evolve without requiring a new registry design for every display
  field.

Current flow:

1. Builder prepares a metadata JSON document.
2. Builder uploads the metadata document to Walrus.
3. Builder registers the slug, Walrus URI, metadata hash, and high-level facets
   on Sui.
4. Dapp Index clients query Sui listings, fetch each Walrus metadata document,
   verify the hash, and render the result.

## ADR-003: Keep Curation And Approval On-Chain

Decision: the current registry starts with owner-controlled listings, and future
versions should add approval, voting, or moderation state to the same registry
flow.

Each listing stores:

- owner address;
- slug;
- metadata URI;
- SHA-256 metadata hash;
- categories;
- created and updated epoch.

The registry supports:

- first-time registration;
- owner-only updates;
- owner-only removal;
- events for registered, updated, and removed listings.

Why:

- the listing slug is stable and easy to query;
- the owner can update their own listing without requiring centralized review
  for every metadata change;
- metadata can live off-chain in Walrus while Sui stores the pointer and hash;
- events give indexers and apps a clean way to follow registry changes.

For the MVP, the Dapp Index frontend can register and update listings against the
configured Sui package and registry object.

Future approval options:

- index reviewer approval before a listing appears in the default index view;
- community voting or staking to promote trusted dapps;
- challenge or report flows for stale, malicious, or abandoned listings;
- separate visibility states such as pending, approved, rejected, hidden, or
  deprecated.

The important constraint is that approval should not require replacing the
registry model. It should extend the Sui registry around the same slug, owner,
metadata URI, and metadata hash.

## Registry Metadata Model

The builder-facing listing data uses the same concepts across Sui and Walrus:

- `id` / slug: stable URL-safe identifier;
- `name` and `summary`: display copy;
- `categories`: index categories such as Money, Logistics, Infrastructure,
  Intel, Coordination, Build, and Social;
- `smartAssemblyTypes`: optional assembly facets such as Storage unit, Turret,
  and Gate;
- `liveUrl`: where users can open the dapp;
- `repositoryUrl`, `packageIds`, `suiPackages`, `serverTenant`, and `notes`:
  optional listing context. Package maintainers, source links, and package icons
  should come from the referenced Move Registry package metadata.

The Sui registry stores the metadata URI and hash so the full metadata can be
retrieved from Walrus and verified off-chain.

## Querying Many Dapp Projects

The Dapp Index frontend needs to query many projects without loading the whole
world through one fragile request.

Planned read model:

- read listing keys from the shared registry;
- batch Sui reads for listing records;
- fetch the referenced Walrus metadata;
- verify each metadata hash before rendering;
- let simple filters such as category and smart assembly type run on the loaded
  listings.

This keeps the first read path direct and easy to understand.

## First Version Listing Order

The first version should not introduce top listings, sponsored placement,
ratings, tribe boosts, or other ranking systems. Those ideas can come later and
should grow from real builder and player needs.

The Dapp Index frontend should not rely on random ordering from the chain. Chain
queries are better treated as paginated reads of registry data, not as a source
of fair randomness.

For the MVP, the default listing order should be simple and predictable:

- show accepted listings from the registry;
- sort by registration epoch, newest first;
- use the listing slug as a deterministic tie-breaker;
- let users narrow the list with category and smart assembly filters.

For the first registry, this can be handled after simple batched reads from Sui.
This keeps the first directory organic and easy to explain.

## Index Surfaces

The directory should not become one flat list forever. The planned split is:

- **All dapps**: the default directory view for every accepted listing.
- **Storage unit dapps**: apps that integrate with or manage storage units.
- **Turret dapps**: apps that integrate with or manage turrets.
- **Gate dapps**: apps that integrate with or manage gates.

This split is modeled as a facet, not as separate registries. A dapp can appear
in All dapps and in one or more assembly views by setting
`smartAssemblyTypes`.

Why:

- builders can list multi-surface tools once;
- users can browse the whole ecosystem or start from the assembly they operate;
- future assembly types can be added without changing the registry ownership
  model.

## Builder Lifecycle

The intended builder path is:

1. Create a metadata document for the dapp.
2. Publish the metadata document to Walrus.
3. Register or update the listing pointer on Sui.
4. Wait for any approval or voting state required by the current registry
   version.
5. The Dapp Index frontend shows the listing in All dapps and any selected
   assembly views.

## Open Decisions

These are intentionally not locked yet:

- whether registration becomes a public builder product surface or a
  reviewer-assisted flow;
- what exact approval model ships first: reviewer approval, voting, staking,
  or a hybrid;
- which metadata fields should be required for the first public builder
  submission flow;
- how much trust, verification, and risk information should be visible to
  players before they open a dapp.

Until those are settled, the MVP remains focused on the builder registry, the
Sui listing flow, Walrus metadata, and the Dapp Index frontend.
