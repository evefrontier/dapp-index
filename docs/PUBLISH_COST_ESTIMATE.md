# Publish Cost Estimate

This document records how the builder publish step estimates WAL and SUI costs
for the wallet **balance preflight**, the known tradeoff in the current
implementation, and how to replace it with live on-chain pricing later.

**Primary code:** [`site/src/builder/publishCostEstimate.ts`](../site/src/builder/publishCostEstimate.ts)

## Why this exists

Publishing a listing uploads each media file and the metadata JSON to Walrus
(paid in **WAL**) and runs several Sui transactions (paid in **SUI** gas). The
publish step shows a per-coin **Ready / Low** preflight so builders see whether
their wallet can cover *this draft* before they start signing.

A flat-floor check (`>= 0.1 WAL`, `>= 0.05 SUI`) is not enough: a multi-image
draft can need more than the floor, which previously showed a false **Ready**
and then failed mid-upload with a `balance::split` Move abort. The estimate
makes the preflight draft-aware.

## Current model (heuristic)

`estimatePublishCost(draft)` computes, per remaining (not yet checkpointed) blob:

- **WAL** = `max(per-blob floor, encoded MiB x epochs x list price) + write fee`,
  summed across blobs, then a `+10%` buffer.
  - encoded size approximated as `sourceBytes x 5` (erasure coding), rounded up
    to whole MiB, minimum 1 MiB per blob.
- **SUI** = `(register + certify per blob) x per-tx fudge + registry tx`, then a
  `+10%` buffer.

The estimate is **display only**. It does not set the transaction gas budget and
does not change publishing behavior.

## Known tradeoff

The WAL pricing inputs are **hardcoded heuristics**, not values read from the
live Walrus system object:

| Constant | Meaning | Risk |
|----------|---------|------|
| `WAL_MIST_PER_ENCODED_MIB_EPOCH` | Walrus list price per encoded MiB per epoch | Set per epoch by the storage committee; can drift |
| `PUBLISH_WAL_PER_BLOB_FLOOR_MIST` | Observed testnet floor per small blob | Calibrated by hand, not authoritative |
| `WAL_ENCODED_SIZE_RATIO` | Source-to-encoded size multiplier | Approximation of erasure coding overhead |
| `PUBLISH_WAL_WRITE_FEE_MIST` | Per-write fee | Dynamic in the protocol |
| `PUBLISH_SUI_PER_WALRUS_TX_MIST`, `PUBLISH_SUI_REGISTRY_TX_MIST` | Gas + relay tip fudge | Gas varies by network and load |

Walrus documentation is explicit that storage price, capacity, and the per-write
fee are **dynamic** and that integrations should not hardcode them (read them
with `walrus info` or from the system object). We accept the hardcoded values
for now because:

- the estimate only gates a UI preflight, not on-chain spend;
- the `+10%` buffer absorbs normal drift;
- fetching live pricing adds an RPC dependency to a hook that currently needs
  none.

If Walrus reprices significantly, the estimate can under- or over-shoot until
the constants are retuned.

## Testnet funding (engineers)

The publish step UI does **not** link to external faucets or exchanges. When
balance preflight shows **Low**, use the resources below (testnet tokens have
no real value).

### SUI (gas)

- [Sui testnet faucet](https://faucet.sui.io/?network=testnet) — fund the
  connected wallet on **Sui testnet** for register/certify/registry gas.

### WAL (Walrus storage)

- **CLI (recommended):** with the Walrus client configured for testnet, run
  `walrus get-wal` to exchange testnet SUI for testnet WAL (see
  [Walrus testnet WAL exchange](https://docs.wal.app/docs/system-overview/available-networks#testnet-wal-faucet)).
- **Web:** [stake-wal.wal.app](https://stake-wal.wal.app/?network=testnet) —
  testnet WAL exchange / staking UI (wallet must be on Sui testnet).

Ensure the wallet network matches `VITE_SUI_NETWORK` (typically testnet for
internal publish testing).

### Mainnet

Mainnet SUI and WAL are not linked from the app. Acquire coins through your
team’s approved process before publishing on mainnet.

## How to switch to live pricing

When we want authoritative numbers:

1. Read the Walrus system object (price per encoded storage unit, write fee,
   storage unit size) via the Walrus client already wired in
   [`site/src/chain/walrusClient.ts`](../site/src/chain/walrusClient.ts).
2. Add a small chain reader (for example `fetchWalrusStoragePricing(client)`)
   that returns the current price, write fee, and unit size.
3. Thread the fetched pricing into `estimatePublishCost` as an optional argument,
   falling back to the hardcoded constants when the read is unavailable so the
   preflight still works offline / under test.
4. Cache the pricing with React Query (similar to `usePublishWalletBalances`)
   with a sensible `staleTime`; it changes at most once per epoch.
5. Keep the SUI gas fudge as a heuristic, or derive it from a dry-run gas
   estimate if one becomes available.

Keep the unit tests in
[`site/test/publishCostEstimate.test.ts`](../site/test/publishCostEstimate.test.ts)
green; add cases that inject live pricing once the reader exists.
