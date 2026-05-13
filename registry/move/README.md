# dapp_registry (Sui Move)

This package lives at **`registry/move/`** in the EVE Frontier Dapp Index repo.

It defines the on-chain registry for indexed dapps: a shared `DappRegistry`
object with `DappListing` values keyed by slug through dynamic fields.

The current public function names (`register_app`, `update_app`, `remove_app`)
match the existing testnet prototype deployment. Before a mainnet publish, the
API can be polished to `register_dapp`, `update_dapp`, and `remove_dapp` if the
frontend and docs are updated in the same release.

## Commands

From this directory:

```bash
sui move build
sui move test
```

From the repository root:

```bash
bun run move:build
bun run move:test
```

## Publish (manual)

See [docs/MOVE_PUBLISH.md](../../docs/MOVE_PUBLISH.md) for testnet publish, env
wiring, and recorded package / registry object IDs.
