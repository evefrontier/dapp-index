# Dapp Registry Deployment

This document records the public Sui package and shared registry object used by
EVE Frontier Dapp Index.

Most builders do **not** need to publish this package. Builders register dapps
against the existing shared registry through the Dapp Index app or supported
tooling.

## Current testnet deployment

This is the current prototype deployment used for testnet wiring.

| Field | Value |
|--------|--------|
| **Transaction digest** | `TFUwCY49EeCz2VVfSR4k2T3mHyaHoim2TrAFsFS1GCC` |
| **Package ID** | `0x22c04589e7ce5fd6c6b982215972244a9648bc96086cc618b246c9a194a171fc` |
| **Shared `DappRegistry` object ID** | `0x81bdd87afb38e560c04aca9afa64775bd8b2af1a644a7424c64511ed9ba8916b` |

Explorer: [testnet.suivision transaction](https://testnet.suivision.xyz/tx/TFUwCY49EeCz2VVfSR4k2T3mHyaHoim2TrAFsFS1GCC).

## Web app env

In `site/.env`, or GitHub Actions variables for production builds:

```bash
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x22c04589e7ce5fd6c6b982215972244a9648bc96086cc618b246c9a194a171fc
VITE_REGISTRY_ID=0x81bdd87afb38e560c04aca9afa64775bd8b2af1a644a7424c64511ed9ba8916b
```

Rebuild the site after changing env vars.

## Maintainer republish checklist

Maintainers can build, test, and publish from the Move package directory:

```bash
cd registry-move
sui client switch --env testnet
sui move build
sui move test
sui client publish --gas-budget 100000000
```

After republishing, update the package ID, registry object ID, explorer link,
and web app env vars in this document.

## Mainnet readiness

Before a mainnet publish, review the contract API and decide whether to rename
the public functions from `register_app`, `update_app`, and `remove_app` to
`register_dapp`, `update_dapp`, and `remove_dapp`. If you rename them, update
the frontend transaction builders and docs in the same PR.
