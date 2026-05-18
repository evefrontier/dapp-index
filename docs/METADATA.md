# Dapp Metadata

Public Dapp Index listings use a compact Sui registry record backed by a richer
Walrus metadata document.

## Storage Model

1. Upload screenshots, posters, and videos to Walrus as separate blobs.
2. Add those Walrus blob references to the metadata JSON.
3. Canonicalize and upload the metadata JSON to Walrus.
4. Register the metadata blob URI and SHA-256 hash in the Sui registry.

The Sui registry remains the ownership and pointer layer. Walrus is the source
for display metadata and public media.

## Sui Registry Record

The Move package stores one `DappListing` per slug:

```json
{
  "owner": "0xBUILDER_ADDRESS",
  "slug": "route-planner",
  "metadata_uri": "walrus://blob/METADATA_BLOB_ID",
  "metadata_hash": [32, "bytes", "of", "sha256"],
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
  "maintainer": {
    "name": "Example Builders",
    "url": "https://builders.example",
    "contact": "hello@builders.example"
  },
  "suiPackages": [
    {
      "network": "testnet",
      "packageId": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "role": "core",
      "modules": ["routes"],
      "explorerUrl": "https://testnet.suivision.xyz/package/0x0000000000000000000000000000000000000000000000000000000000000000"
    }
  ],
  "media": {
    "thumbnail": "dashboard",
    "hero": "dashboard",
    "items": [
      {
        "id": "dashboard",
        "kind": "image",
        "role": "hero",
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
- Gallery `thumbnail` and `hero` values must reference IDs from `media.items`.
- Media IDs must be unique within the listing.
