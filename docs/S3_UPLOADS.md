# Browser Uploads via S3 + Presigning Lambda

How Dapp Index gets builder-supplied files (screenshots, videos, and a metadata
manifest) from a browser into object storage without ever putting AWS
credentials in the frontend, and how the frontend code is organised around that.

This is a reusable pattern: any wallet-connected SPA that needs user uploads but
has no backend of its own can copy it. Nothing here is specific to the shape of
our metadata — that lives in [`docs/METADATA.md`](METADATA.md).

## Why This Exists

Dapp Index is a static Vite SPA. There is no application server: the browser
talks to Sui for on-chain state and needs somewhere to host the files a listing
references. That gives three hard constraints:

1. **No long-lived credentials in the client.** Anything shipped in the bundle
   is public, so the browser can never hold S3 keys.
2. **No byte-proxying backend.** Videos are large; we do not want an HTTP
   service in the middle paying for ingress and egress twice.
3. **Public, stable read URLs.** The URI we upload to is written into on-chain
   metadata. It has to keep resolving for as long as the listing exists.

The answer to all three is the standard **presigned-PUT** pattern: a tiny
credentialed service mints a short-lived, narrowly-scoped upload URL, and the
browser PUTs the bytes straight to storage.

> **Status:** S3 + CDN is the MVP storage provider for Dapp Index while Walrus
> is being finished. The metadata schema accepts both `walrus://blob/<id>` and
> `https://` URIs for that reason. The upload pattern below is independent of
> that choice and applies to either.

## Architecture At A Glance

```
                    1. POST /uploads/presign
  ┌───────────┐      (address, slug, purpose,     ┌──────────────────────┐
  │           │       filename, contentType,      │  Lambda Function URL │
  │  Browser  │──────  contentLength, sha256) ───▶│  (presign only)      │
  │   (SPA)   │                                   │                      │
  │           │◀───── uploadUrl, headers, ────────│  holds the only IAM  │
  │           │       objectKey, publicUrl        │  credentials         │
  └─────┬─────┘                                   └──────────────────────┘
        │
        │ 2. PUT bytes directly to the presigned URL
        ▼
  ┌───────────────┐        3. public reads       ┌───────────┐
  │  S3 bucket    │◀────────────────────────────▶│    CDN    │──▶ everyone
  │  (private)    │      (origin access only)    │  (HTTPS)  │
  └───────────────┘                              └───────────┘
                                                       │
        4. the CDN URL is what gets written on-chain ───┘
```

Two round trips per file. The bytes never touch the Lambda.

## Part 1 — S3 Setup

The bucket is **private and write-only from the client's perspective**:

- **Block Public Access stays on.** No public bucket policy, no public ACLs.
- **Writes only via presigned PUT.** The single IAM principal allowed to write
  is the Lambda's execution role, and it only ever hands out presigned URLs — it
  does not write objects itself.
- **Reads only via the CDN.** A CloudFront distribution sits in front of the
  bucket with origin access to it; the bucket itself is not reachable directly.
  The `publicUrl` the Lambda returns is the CDN URL.
- **CORS must allow browser PUT.** The bucket's CORS config has to permit `PUT`
  from the site's origins and allow the headers the presign response asks the
  client to send (at minimum `Content-Type`). This is the single most common
  setup failure, and it surfaces client-side as a *network* error rather than an
  HTTP status, because the browser blocks the request before it is sent — see
  the `put_network` code below.
- **`Content-Type` is set at PUT time** from the headers the Lambda returned,
  because the CDN serves that same value back on read.

### Key Namespace

Keys are namespaced and deterministic:

```
<network>/<wallet-address>/<slug>/<filename>

testnet/0xabc…/route-planner/thumbnail.png
testnet/0xabc…/route-planner/metadata.json
```

Two properties matter:

- **The prefix is authorization, not decoration.** The Lambda — not the client —
  decides the key, so a caller cannot write outside its own
  `<network>/<address>/<slug>/` prefix even though it chose the filename.
- **Filenames are deterministic**, so republishing a listing overwrites in place
  instead of accumulating orphaned objects. Media files are
  `<media-id>.<ext>` (`stableMediaFilename()` maps MIME type → extension and
  slugifies the id); the manifest is always `metadata.json`.

Determinism has one consequence worth stating explicitly: because our on-chain
metadata pins a `sha256` per asset, overwriting a key with *different* bytes
invalidates verification for anything still pointing at the old hash. Enable
bucket versioning if you need to recover from that; treat published keys as
append-only in practice.

### Things To Decide Per Deployment

- Bucket versioning and lifecycle rules (we keep it simple: versioning for
  recovery, no expiry, since listings are meant to persist).
- Maximum object size — enforce it in the Lambda, not only in the client.
- Whether the CDN domain is a custom domain. **Prefer one.** The returned
  `publicUrl` ends up in on-chain metadata, so that hostname becomes a permanent
  public API; a raw `*.cloudfront.net` name is much harder to migrate off later.

## Part 2 — The Lambda, And Why It Exists

**Surface:** one route, `POST {VITE_UPLOAD_API_BASE}/uploads/presign`, exposed
as a **Lambda Function URL** — no API Gateway. For a single unauthenticated
route with no usage plans or custom authorizers, a Function URL is less
infrastructure, one less hop of latency, and cheaper.

**Request** (JSON):

| Field           | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `address`       | Wallet address; becomes part of the key prefix       |
| `slug`          | Listing slug; becomes part of the key prefix        |
| `purpose`       | `media` or `manifest`                                |
| `filename`      | Deterministic filename chosen by the client          |
| `contentType`   | MIME type to store and later serve                   |
| `contentLength` | Byte length, so the Lambda can enforce a size cap    |
| `sha256`        | Content hash, for validation and audit               |

**Response** (JSON):

| Field               | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `uploadUrl`         | The presigned S3 URL to PUT to                     |
| `method`            | Always `PUT`                                       |
| `headers`           | Header map the client must send verbatim with the PUT |
| `objectKey`         | Final key, for logging and debugging                |
| `publicUrl`         | The CDN read URL — this is what gets published     |
| `expiresInSeconds`  | Optional; informational for the client             |

Errors return a non-2xx with `{ "message": "..." }`. The frontend surfaces that
message verbatim, so write it for a builder, not for a log.

### Why A Lambda Instead Of…

- **…S3 credentials in the browser?** They would be public. Non-starter.
- **…a publicly writable bucket?** Anyone could write anywhere in it,
  overwriting other builders' published assets.
- **…proxying the bytes through the Lambda?** A Function URL request body is
  capped at 6 MB, which our video uploads exceed, and proxying would double both
  latency and data-transfer cost for every file. Presigning moves the bytes
  browser→S3 directly and keeps the Lambda's work at a few milliseconds of
  signing regardless of file size.

So the Lambda is deliberately the *only* trusted decision-maker in the flow. It
owns: the key namespace, the allowed content types, the size cap, and the
presign TTL (short — minutes, not hours). Everything the client sends is a
request, not an instruction.

### Trust Boundary — Read This Before Reusing It

In the current MVP, `address` is an unverified claim in the request body. The
endpoint is unauthenticated, so anyone who can reach it can obtain a presigned
URL for a key under any address prefix. That is acceptable for a testnet MVP
where the on-chain registry — not the bucket — is the source of truth about who
owns a slug, and where a wallet signature is still required to publish anything.

Before this pattern carries anything you care about, add:

- proof of address control (sign a nonce/message, verify it in the Lambda);
- a hard `contentLength` cap and a content-type allowlist server-side;
- rate limiting per address/IP;
- ideally, a check that the caller actually owns the slug on-chain.

**The Lambda's own source is not in this repo** — it is deployed separately.
What is authoritative here is the request/response contract above, which the
frontend enforces defensively.

## Part 3 — Frontend Structure

Four small storage modules, layered so each one knows as little as possible, plus
one controller that sequences the whole publish.

```
site/src/storage/
  uploadApi.ts          → talks to the Lambda; validates the response
  s3Put.ts              → does the raw PUT; knows nothing about the API
  s3MetadataStorage.ts  → domain layer: uploadMediaToS3 / uploadManifestToS3
  uploadErrors.ts       → UploadError + a closed union of error codes
site/src/utils/
  resolveMediaUrl.ts    → read side: URI → fetchable URL
site/src/builder/
  useRegistrationDraftPublishController.ts → orchestration, stages, resume
```

### `uploadApi.ts` — Never Trust The Presign Response

[uploadApi.ts](../site/src/storage/uploadApi.ts) posts the presign request and
then validates every field it depends on before returning
(`requireNonEmptyString` for `uploadUrl` / `objectKey` / `publicUrl`,
`normalizeHeaders` for the header map, tolerant JSON parsing). A malformed 200
from the service becomes a typed `presign_invalid_response`, not an
`undefined` that fails three call frames later at the PUT.

It also normalises the configured base URL (`replace(/\/+$/, '')`) so a trailing
slash in config cannot produce `//uploads/presign`.

### `s3Put.ts` — One Job

[s3Put.ts](../site/src/storage/s3Put.ts) PUTs a body to a URL with the given
headers and maps failures. It deliberately does not know that a Lambda exists,
which is what makes it trivially testable and swappable if the storage provider
changes.

### `s3MetadataStorage.ts` — The Only Layer Callers Use

[s3MetadataStorage.ts](../site/src/storage/s3MetadataStorage.ts) composes the
two steps and exposes two functions:

- `uploadMediaToS3({ address, slug, filename, contentType, bytes, sha256 })`
- `uploadManifestToS3({ address, slug, bytes, sha256 })` — pins
  `filename: 'metadata.json'` and `contentType: 'application/json'`

Both return `{ uri, objectKey, sha256, sizeBytes }`, where `uri` is the public
CDN URL. One detail worth copying: bytes are copied into a fresh `Uint8Array`
before being wrapped in a `Blob`, so a view over a larger `ArrayBuffer` can never
upload more than it should.

### `uploadErrors.ts` — Typed Failures

A single `UploadError` class carrying a closed union of codes, so the UI can
branch on cause instead of matching on message strings:

| Code                        | Means                                        |
| --------------------------- | -------------------------------------------- |
| `upload_api_unconfigured`   | No API base configured                       |
| `presign_network`           | Could not reach the Lambda (DNS/CORS/offline) |
| `presign_http`              | Lambda rejected the request (carries status + its message) |
| `presign_invalid_response`  | Lambda returned 2xx with an unusable body    |
| `put_network`               | PUT never reached S3 — **usually bucket CORS** |
| `put_http`                  | S3 rejected the PUT (403 = expired/mismatched presign) |
| `cancelled`                 | User navigated away or restarted the publish |

Separating `*_network` from `*_http` is what makes a broken CORS config
diagnosable at all, since a browser-blocked request has no status code to report.

### Dependency Injection Instead Of Network Mocking

Every entry point accepts optional `apiBase` and `fetchImpl`:

```ts
await uploadMediaToS3({
  /* … */
  apiBase: 'https://uploads.example.com',
  fetchImpl: async (input, init) => { /* assert and return a Response */ },
});
```

[site/test/s3Upload.test.ts](../site/test/s3Upload.test.ts) covers the whole
matrix — missing config, network failure, HTTP error with a service message,
malformed JSON, the happy path, S3 403, and that the manifest upload really sends
`purpose: 'manifest'` — with no HTTP interception library and no live network.

### Orchestration: The Publish Controller

[useRegistrationDraftPublishController.ts](../site/src/builder/useRegistrationDraftPublishController.ts)
sequences a publish. The order is chosen so that nothing irreversible happens
before everything cheap has been checked:

1. **Flush the draft** to local storage.
2. **Check the slug on-chain** → decide `register` vs `update`; abort if another
   wallet owns it.
3. **Read local media**: SHA-256 each blob and probe real dimensions/duration
   from the file itself (`localMediaProbe.ts`), rather than trusting stored
   values.
4. **Preflight the metadata** using placeholder URIs
   (`https://preview.local/<id>`) so schema violations — a video with no poster
   image, an unreadable duration — fail **before a single byte is uploaded**.
5. **Upload each media file**, updating a stage string per file for the UI.
6. **Rebuild the metadata** with the real CDN URIs returned by the uploads.
7. **Hash the metadata**: SHA-256 over `canonicalStringify()` output (sorted
   keys) so the hash is reproducible by anyone.
8. **Upload `metadata.json`**, passing that hash as the presign `sha256`.
9. **Sign and execute the Sui transaction** with `metadata_uri` +
   `metadata_hash`; fail closed on a failed digest.
10. **Finalize the draft** as published.

Two properties make this survivable in a real browser:

**Checkpoint and resume.** After each media upload, the controller writes a
`DraftPublishedMediaCheckpoint` (`mediaId`, `storageUri`, `sha256`, size,
dimensions, duration) via `storage.savePublishCheckpoint()`. On a retry,
`findMatchingMediaCheckpoint()` skips any file whose id *and* hash *and* size
*and* dimensions all still match, and the manifest upload is skipped entirely if
`metadataHash` is unchanged. This matters because a publish spans N uploads plus
a wallet signature the user may sit on or reject — restarting must not re-upload
a 40 MB video.

**Cancellation.** A `useCancellableAsync` request id is checked (`isCurrent()`)
between every await; a stale run returns silently and a `cancelled` `UploadError`
is swallowed rather than shown as a failure.

### Gating And UI Feedback

Readiness blockers are computed before the button is even enabled — including
`Configure VITE_UPLOAD_API_BASE for media uploads.` — so a misconfigured
deployment fails as a visible precondition instead of a runtime error mid-upload
(`createRegistrationPublishReadiness()` in
[registrationDraftPublish.ts](../site/src/builder/registrationDraftPublish.ts)).

During the run, the controller pushes human-readable stage strings
(`Checking slug.`, `Uploading media 2/3: demo.webm.`, `Uploading metadata.`,
`Registering on Sui.`) into publish state, which
[publishStepPresentation.ts](../site/src/builder/publishStepPresentation.ts)
turns into status rows. Presentation is a pure function of state and unit-tested
separately from the controller.

### Read Side

[resolveMediaUrl.ts](../site/src/utils/resolveMediaUrl.ts) maps a stored URI to
something the browser can fetch: `https://` passes through, `walrus://blob/<id>`
goes through an injected resolver, and everything else — including plain
`http://` — returns `null`. That keeps the two storage providers
interchangeable at the render layer.

Note: this helper currently has tests but is **not yet wired into the catalog
render path**. If you copy this pattern, wire your read-side resolver at the same
time as the write side.

### Configuration

One variable: `VITE_UPLOAD_API_BASE` — the Lambda Function URL origin, no
trailing slash — read through `viteUploadApiBase()` in `src/chain/env.ts`.
Because it is baked in at build time, each environment gets its own build; there
is no runtime config fetch.

## Reuse Checklist

To apply this pattern in another app:

- [ ] Private bucket, Block Public Access on, CDN with origin access in front.
- [ ] CORS on the bucket allowing `PUT` from your origins with the headers you
      return.
- [ ] One presign endpoint. The **server** decides the key; the client only
      proposes a filename.
- [ ] Server-side enforcement of content type, size cap, and short presign TTL.
- [ ] Real authorization on the endpoint before it matters (see the trust
      boundary section — do not ship the MVP version to mainnet).
- [ ] Client split into api-call / raw-PUT / domain layers, with `fetchImpl`
      injectable.
- [ ] Typed error codes that distinguish network from HTTP failures.
- [ ] Deterministic keys, so retries overwrite instead of duplicating.
- [ ] Checkpoints if a flow uploads more than one file or ends in a signature.
- [ ] A read-side resolver, so the storage provider stays swappable.

## Verification

```bash
bun run site:test
```

Relevant files: `site/test/s3Upload.test.ts`,
`site/test/resolveMediaUrl.test.ts`,
`site/test/registrationDraftPublish.test.ts`. All 176 site tests pass on this
branch.
