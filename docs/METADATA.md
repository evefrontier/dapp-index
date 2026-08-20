# Dapp Metadata

Public Dapp Index listings use a compact Sui registry record backed by a richer
Walrus metadata document.

## Storage Model

1. Upload screenshots, posters, and videos to Walrus as separate blobs.
2. Add those Walrus blob references to the metadata JSON.
3. Canonicalize and upload the metadata JSON to Walrus.
4. Register the metadata blob URI and SHA-256 hash in the Sui registry.

### Canonical JSON

The `metadataHash` is a SHA-256 hash of the **canonical form** of the metadata
JSON. Canonical form is defined as:

- Object keys sorted lexicographically (UTF-16 code unit order, ascending).
- No extra whitespace — no indentation, no newlines between tokens.
- UTF-8 encoded.

The `canonicalJson` utility in `site/src/utils/canonicalJson.ts` produces this
form. Builders computing the hash independently must follow the same rules to
produce a matching hash.

The Sui registry remains the ownership and pointer layer. Walrus is the source
for display metadata and public media.

## Sui Registry Record

The Move package stores one `DappListing` per slug:

```json
{
  "owner": "0xBUILDER_ADDRESS",
  "slug": "route-planner",
  "metadata_uri": "walrus://blob/METADATA_BLOB_ID",
  "metadata_hash": [180, 23, 246, 5, 202, 88, 131, 17, 64, 201, 37, 155, 98, 44, 7, 219, 113, 250, 60, 141, 88, 179, 24, 7, 34, 118, 93, 41, 206, 77, 162, 5],
  "categories": ["logistics", "infrastructure"],
  "created_at_epoch": 123,
  "updated_at_epoch": 123
}
```

Registration and update transactions provide:

```json
{
  "packageId": "0xDAPP_REGISTRY_PACKAGE_ID",
  "registryId": "0xSHARED_DAPP_REGISTRY_OBJECT_ID",
  "slug": "route-planner",
  "metadataUri": "walrus://blob/METADATA_BLOB_ID",
  "metadataHash": "64-char-hex-sha256-of-canonical-metadata-json",
  "categories": ["logistics", "infrastructure"]
}
```

## Walrus Metadata Manifest

The `id` field in the manifest **must equal** the on-chain `slug` for this
listing, and `categories` **must exactly match** the on-chain `categories` array
supplied during registration. Clients that discover inconsistencies between the
manifest fields and the registry record should treat the listing as invalid.

```json
{
  "schema": "evefrontier.dapp-index.metadata",
  "schemaVersion": 1,
  "id": "route-planner",
  "name": "Route Planner",
  "summary": "Plan and share Frontier hauling routes.",
  "description": "A route planning dapp for coordinating storage-unit and gate logistics.",
  "categories": ["logistics", "infrastructure"],
  "smartAssemblyTypes": ["storage-unit", "gate"],
  "serverTenant": "stillness",
  "liveUrl": "https://route-planner.example",
  "repositoryUrl": "https://github.com/example/route-planner",
  "documentationUrl": "https://docs.route-planner.example",
  "suiPackages": [
    {
      "network": "testnet",
      "role": "core",
      "mvrName": "@example/route-planner",
      "packageId": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "packageInfoId": "0x1111111111111111111111111111111111111111111111111111111111111111",
      "modules": ["routes"],
      "explorerUrl": "https://testnet.suivision.xyz/package/0x0000000000000000000000000000000000000000000000000000000000000000"
    }
  ],
  "media": {
    "thumbnail": "dashboard",
    "items": [
      {
        "id": "dashboard",
        "kind": "image",
        "role": "thumbnail",
        "uri": "walrus://blob/dashboardBlobId",
        "mimeType": "image/webp",
        "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
        "sizeBytes": 824512,
        "width": 1600,
        "height": 900,
        "alt": "Dashboard showing active storage routes",
        "caption": "Main operations dashboard"
      },
      {
        "id": "demo",
        "kind": "video",
        "role": "demo",
        "poster": {
          "uri": "walrus://blob/posterBlobId",
          "mimeType": "image/webp",
          "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
          "sizeBytes": 420128,
          "width": 1600,
          "height": 900,
          "alt": "Route planner demo poster"
        },
        "sources": [
          {
            "uri": "walrus://blob/webmBlobId",
            "mimeType": "video/webm",
            "codecs": "vp9,opus",
            "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
            "sizeBytes": 41839200,
            "width": 1920,
            "height": 1080,
            "durationSeconds": 42
          }
        ],
        "caption": "Creating a route and handing it off to a fleet"
      }
    ]
  },
  "proofs": {
    "domain": {
      "url": "https://route-planner.example/.well-known/eve-dapp-index.json"
    }
  },
  "notes": "Public listing media is hosted on Walrus."
}
```

## Public Media Rules

- Public media source URIs must use `walrus://blob/<blobId>`.
- Images allow `image/webp`, `image/png`, and `image/jpeg`.
- Videos allow only `video/webm`.
- WebM videos should use `vp9,opus` or `vp8,opus`.
- Each image or poster is limited to `5 MB`.
- Each video source is limited to `60 MB`, `1920x1080`, and `60` seconds.
- A listing may include at most `10` media items and at most `2` videos.
- Total public media across screenshots, posters, and video sources is limited
  to `150 MB`.
- Gallery `thumbnail` values must reference IDs from `media.items`.
- Media IDs must be unique within the listing.
