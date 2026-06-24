# Publish UX & Walrus Cost Roadmap

Handoff document for improving the builder **Publish listing** experience, reducing
wallet friction, and optionally evolving metadata schema v2. Created from investigation
of publish hangs, approval timeouts, and multi-signature confusion (2026).

**Related docs:** `docs/BUILDER_PLAN.md`, `docs/METADATA.md`, `registry/schema/registry-entry.schema.json`

**Primary code surfaces:**

| Area | Path |
|------|------|
| Publish orchestration | `site/src/builder/useRegistrationDraftPublishController.ts` |
| Publish UI | `site/src/builder/PublishStepScreen.tsx` |
| Metadata assembly | `site/src/builder/registrationDraftPublish.ts` |
| Schema validation | `site/src/utils/registryMetadata.ts`, `registry/schema/registry-entry.schema.json` |
| Types | `site/src/types/dapp-index.ts` |
| Walrus client | `site/src/chain/walrusClient.ts` |
| Draft checkpoints | `site/src/storage/draftStore.ts` (`savePublishCheckpoint`) |

---

## Problem summary

Builders publishing a listing with multiple media files experience:

1. **Many wallet approvals** — each Walrus blob needs `register_blob` + `certify_blob`; metadata JSON and registry listing add more.
2. **Opaque progress** — UI shows vague stages (`Uploading metadata.`, `Publishing`) with no step counter or “what to do now”.
3. **Silent gaps** — between register and certify, Walrus upload relay runs with **no wallet popup**; users think publish is stuck.
4. **Raw wallet JSON** — Move transaction payloads (`register_blob`, `certify_blob`) do not map to filenames or user intent.
5. **Timeouts** — `Transaction approval timed out` when a later prompt is missed or relay/upload is slow.

**Prerequisites (wallet, SUI, WAL, network) are working** when Publish setup shows Ready — failures are at signing/upload steps, not readiness gates.

---

## Current architecture (schema v1)

### Metadata shape

- On-chain registry stores `metadata_uri` + `metadata_hash` pointing to **one JSON blob** on Walrus.
- JSON may reference **many media blobs**, each with `uri: "walrus://blob/{id}"`, per-item `sha256`, `mimeType`, dimensions, `role` (hero, logo, gallery, demo, thumbnail).
- Schema: `registry/schema/registry-entry.schema.json`, `schemaVersion: 1`.

See `docs/METADATA.md` — “Upload screenshots, posters, and videos to Walrus as separate blobs.”

### Publish pipeline (browser)

```
1. Save draft (autosave flush)
2. Check slug (on-chain scan)
3. For each local media file (unless checkpointed):
     a. register_blob  → wallet #1
     b. upload relay   → no wallet (network)
     c. certify_blob   → wallet #2
4. Build metadata JSON
5. Upload metadata JSON blob (unless checkpointed): register + certify
6. signAndExecuteTransaction — register or update listing on Sui registry
7. Clear local draft on success
```

Walrus config: `WALRUS_STORAGE_EPOCHS = 5` in publish controller; upload relay from `viteWalrusUploadRelayHost()`.

### Signature count formula (v1)

```
signatures = (new_media_blobs × 2) + (metadata_blob × 2 if not checkpointed) + 1 registry
```

Each **image** and **video** = 1 blob. Video **poster** = separate image blob.

| Listing contents | Blobs | Signatures |
|------------------|-------|------------|
| 2 images + metadata | 3 | 7 |
| 5 images + 1 video + poster + metadata | 8 | **17** |
| 10 images + 2 videos + posters + metadata (max-ish) | 14+ | 29+ |

**Checkpoints:** `draft.publish.media` and metadata hash/blob ids skip re-upload on retry (`createUploadedMediaAssets`, `uploadMetadataJson`).

### Cost notes

| Cost | Driver |
|------|--------|
| **WAL** | Walrus `reserve_space` ≈ bytes stored × epochs (5). Mostly **total MB**, not blob count. |
| **SUI gas** | Every on-chain tx (register, certify, registry). **Fewer blobs → fewer txs → less gas.** |
| **Relay tip** | SUI tip on each blob register (visible as gas coin split in wallet preview). |

Bundling media saves **transactions and UX** more than WAL unless compression reduces bytes.

---

## Observed failure modes (from debugging)

| Symptom | Likely cause |
|---------|----------------|
| Stuck on `Uploading metadata.` / `Running` | Waiting for **certify_blob** after metadata **register**, or upload relay slow |
| `Transaction approval timed out` | Wallet prompt not approved in time; or extension issues |
| `Extension context invalidated` / `content.js` errors | Browser extension noise — often **not** app code; can correlate with broken wallet |
| Only one prompt when expecting many | Either checkpoints skipped earlier blobs, or user missed subsequent prompts |
| On-chain listing “metadata not loaded” | Catalog fetch/parse failed — separate from publish UI (`registryCatalog.ts` fallback) |

---

## Goals

### Must have (Phase 1 — UX, no schema change)

- [ ] **Pre-publish estimate:** “Up to N wallet approvals” from `draft.media` + metadata + registry.
- [ ] **Step progress:** “Approval X of N” with human labels (filename, register vs certify vs registry).
- [ ] **Phase labels:** Walrus media → Metadata JSON → Registry listing.
- [ ] **Waiting states:** Distinguish “Approve in wallet now” vs “Uploading to Walrus relay — keep tab open”.
- [ ] **Checkpoint visibility:** Show which blobs already done from prior attempt; “Retry skips steps 1–K”.
- [ ] **Failure detail:** On error, show failed step number, action (certify metadata), and safe-to-retry.
- [ ] **Pre-flight copy:** Short explanation that each file = 2 approvals (register + certify).

### Should have (Phase 1 continued)

- [ ] Unit tests for signature count estimator from draft media list.
- [ ] Optional: disable “Publish” until user acknowledges multi-step flow (first-time tooltip/modal).
- [ ] Docs update in `docs/METADATA.md` builder-facing “What to expect when publishing”.

### Nice to have (Phase 2 — operational, still v1)

- [ ] Builder guidance: prefer WebP, reasonable dimensions → lower WAL bytes.
- [ ] Media step hint: “Each file adds ~2 wallet approvals at publish.”
- [ ] Longer wallet timeout or configurable timeout (if dApp Kit / wallet API allows — investigate first).

### Strategic (Phase 3 — schema v2, optional)

- [ ] Evaluate **media bundle** blob to cut signatures (see below).
- [ ] RFC + governance if changing public schema.

---

## Options comparison

### Option A — Keep v1, improve UX only (recommended first)

**Effort:** Medium (frontend + publish state machine). **Risk:** Low.

| Pros | Cons |
|------|------|
| No schema migration | Still many signatures for rich listings |
| Direct aggregator URLs per asset | WAL/gas still scale with blob count |
| Checkpoints already exist | Does not reduce max approvals |
| Directory/detail code unchanged | |

### Option B — Schema v2 full media bundle

One Walrus archive (e.g. zip) for all media; metadata references `mediaBundle.uri` + per-item `path` + hashes.

| Pros | Cons |
|------|------|
| **5 signatures** for 5 images + video + poster + metadata (vs 17) | Schema v2, migration, dual-read in catalog |
| Fewer relay tips and gas txs | Must fetch/unpack/cache bundle in browser |
| Simpler publish loop (pack → upload) | Re-publish any image = rebuild whole bundle |
| Easier to explain: 3 phases | Third-party consumers need bundle spec |

**Example v2 sketch:**

```json
{
  "schemaVersion": 2,
  "mediaBundle": {
    "uri": "walrus://blob/BUNDLE_ID",
    "format": "application/vnd.evefrontier.dapp-index.media-pack+zip",
    "sha256": "...",
    "sizeBytes": 8500000
  },
  "media": {
    "hero": "hero",
    "items": [
      {
        "id": "hero",
        "kind": "image",
        "role": "hero",
        "path": "images/hero.webp",
        "mimeType": "image/webp",
        "sha256": "...",
        "width": 1280,
        "height": 720,
        "alt": "..."
      }
    ]
  }
}
```

### Option C — Hybrid v2

Hero/thumbnail stay separate blobs (fast directory cards); gallery/video in bundle.

| Pros | Cons |
|------|------|
| Fast card loads | Two mental models in one schema |
| ~7 signatures for large listing (example) | More complex builder + publish |
| Balanced | Less savings than full bundle |

### Option D — Backend / relay publish

Server batches Walrus uploads; user signs registry only (or delegates).

| Pros | Cons |
|------|------|
| Best wallet UX | Trust, funding, abuse, infra |
| Can keep v1 read URLs | Not aligned with current client-only publish |

---

## Signature reference table

| Listing | v1 | v2 full bundle | v2 hybrid (hero + bundle) |
|---------|----|----------------|---------------------------|
| 2 images + metadata | 7 | 5 | 7 |
| 5 images + video + poster + metadata | 17 | 5 | ~7–9 |
| 1 image + metadata | 5 | 5 | 5 |

---

## Suggested implementation plan

### Phase 1 — Publish progress UX (do this first)

**Goal:** Builders always know what step they’re on and what the wallet will ask.

1. **Add `publishProgressModel.ts`** (or similar under `site/src/builder/`):
   - `estimatePublishSteps(draft, checkpoints)` → total steps, remaining steps, list of `{ id, label, kind: 'register' | 'certify' | 'relay' | 'registry' }`.
   - Map Walrus `writeBlob` sub-steps explicitly (today only `setStage('Uploading …')` on the outer loop).

2. **Extend `RegistrationDraftPublishState`** with optional:
   - `stepIndex`, `stepTotal`, `stepKind`, `stepLabel`, `phase: 'media' | 'metadata' | 'registry'`.

3. **Wrap `uploadBlob` / Walrus flow** to call `setPublishingStage` (or new setter) before register, after register (relay), before certify, after certify.

4. **Update `PublishStepScreen.tsx`:**
   - Progress bar or step list.
   - Prominent “Approve in wallet” vs “Uploading — no action needed”.
   - Pre-publish summary before first click (when `status === 'idle'`).
   - Error panel with step context on failure.

5. **Tests:** estimator unit tests; optional integration test with mocked uploader.

6. **Verify:** `bun run site:test`, `bun run site:typecheck`, manual publish on testnet with 2 images.

**Out of scope for Phase 1:** schema changes, batching PTBs, wallet timeout changes.

### Phase 2 — Builder guidance & docs

1. Media step copy: per-file approval cost.
2. `docs/METADATA.md`: signature table, checkpoint retry behavior.
3. Optional: WebP/size hints in media step validation messages.

### Phase 3 — Schema v2 RFC (if Phase 1 insufficient)

1. Write RFC: bundle format (zip + manifest.json), v1/v2 coexistence, catalog dual-read.
2. Prototype pack/unpack in `site/src/builder/` without switching default.
3. Update `registry-entry.schema.json` with `schemaVersion: 2` branch.
4. Publish path: pack → single `writeBlob` → metadata → registry.
5. Directory: bundle cache (IndexedDB), resolve hero/thumbnail paths.
6. Migration: new listings v2; v1 listings unchanged.

### Phase 4 — Advanced (optional)

- Investigate Walrus SDK / PTB batching for multiple registers in one tx (may not reduce certify count).
- Server-side publish relay for teams that opt in.

---

## UX copy suggestions (Phase 1)

**Pre-publish:**

> This listing needs **up to 17 wallet approvals** (8 files × 2 steps + 1 registry transaction).  
> Each image or video is stored as its own Walrus blob.  
> If you already started publishing, completed steps will be skipped.

**During relay wait:**

> Uploading **Screenshot 2026-06-10.png** to Walrus — no wallet action. This can take up to a minute.

**Before certify:**

> Step 6 of 17 — **Certify** metadata for **test-01.json**. Approve in your wallet.

**On timeout:**

> Step 9 timed out: certify metadata JSON. Steps 1–8 are saved. Click **Publish listing** to continue.

---

## Verification checklist (for any agent picking this up)

- [ ] Publish with 0 media: metadata + registry only (3 signatures).
- [ ] Publish with 2 PNGs: expect 7 signatures; progress UI matches.
- [ ] Interrupt mid-publish, retry: checkpoints skip completed blobs.
- [ ] Failure shows step number and message, not only `Failed.`
- [ ] Publish setup Ready with testnet wallet, sufficient SUI/WAL.
- [ ] `bun run site:test` and `bun run site:typecheck` pass.

---

## Open questions

1. Does `@mysten/dapp-kit` / `@evefrontier/dapp-kit` expose configurable sign timeout?
2. Can Walrus `writeBlob` register+certify be batched into fewer user prompts without schema change?
3. Is hybrid v2 (hero separate) worth the complexity vs full bundle?
4. Should publish progress persist in `draft.publish` for resume after page refresh?

---

## Status

**Paused** — user chose to defer implementation; this document is the handoff artifact.

**Confirmed working (as of investigation):** wallet connect, testnet network match, SUI/WAL balances above minimums, publish readiness gates.

**Not done:** progress UX, schema v2, timeout handling improvements.
