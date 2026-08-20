/**
 * TEMPORARY local dev catalog entries for UI work without wallet publish.
 * Delete this file, devCatalogMediaUrls.ts, and site/public/dev-catalog/ before shipping.
 *
 * Gated on `VITE_ENABLE_FIXTURE_DATA=true` (the `dev` environment only) rather
 * than on `import.meta.env.DEV`, which is false in every deployed build and so
 * cannot tell a deployed dev environment from test or live.
 */

import { viteFixtureDataEnabled } from '@/chain/env';
import {
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/constants';
import type { DappIndexEntry } from '@/types/dapp-index';

const HEX_32 = '0'.repeat(64);
const PACKAGE_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const DEV_CATALOG_FIXTURE_ENTRIES: DappIndexEntry[] = [
  {
    schema: DAPP_INDEX_METADATA_SCHEMA,
    schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
    id: 'frontier-library',
    name: 'Frontier Library',
    summary: 'Browse and share verified builder metadata for Frontier tools.',
    description:
      'A catalog and documentation hub for Frontier ecosystem dapps. Listings are registry-backed with Walrus-hosted metadata, category filters, smart assembly tags, and rich media for detail pages.',
    categories: ['build', 'intel'],
    smartAssemblyTypes: ['storage-unit'],
    serverTenant: 'stillness',
    liveUrl: 'https://frontier-library.example',
    repositoryUrl: 'https://github.com/example/frontier-library',
    documentationUrl: 'https://docs.frontier-library.example',
    notes:
      'Temporary dev fixture entry. Replace with on-chain publish output when wallet flows are available.',
    suiPackages: [
      {
        network: 'testnet',
        packageId: PACKAGE_ID,
        role: 'core',
        mvrName: '@example/frontier-library',
        packageInfoId:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        modules: ['registry', 'catalog'],
      },
    ],
    media: {
      thumbnail: 'thumbnail',
      items: [
        {
          id: 'thumbnail',
          kind: 'image',
          role: 'thumbnail',
          uri: 'walrus://blob/dev-frontier-thumbnail',
          mimeType: 'image/webp',
          sha256: HEX_32,
          sizeBytes: 824_512,
          width: 1600,
          height: 900,
          alt: 'Frontier Library catalog card image',
        },
        {
          id: 'logo',
          kind: 'image',
          role: 'logo',
          uri: 'walrus://blob/dev-frontier-logo',
          mimeType: 'image/png',
          sha256: HEX_32,
          sizeBytes: 48_000,
          width: 256,
          height: 256,
          alt: 'Frontier Library logo',
        },
        {
          id: 'gallery-catalog',
          kind: 'image',
          role: 'gallery',
          uri: 'walrus://blob/dev-frontier-gallery-1',
          mimeType: 'image/webp',
          sha256: HEX_32,
          sizeBytes: 640_000,
          width: 1600,
          height: 900,
          alt: 'EVE Frontier dashboard screenshot',
          caption: 'EVE Frontier dashboard — reference layout for gallery styling.',
        },
        {
          id: 'gallery-detail',
          kind: 'image',
          role: 'gallery',
          uri: 'walrus://blob/dev-frontier-gallery-2',
          mimeType: 'image/webp',
          sha256: HEX_32,
          sizeBytes: 580_000,
          width: 1600,
          height: 900,
          alt: 'Monkey Show detail page screenshot',
          caption: 'Current sparse on-chain detail view — target for the richer layout.',
        },
      ],
    },
  },
  {
    schema: DAPP_INDEX_METADATA_SCHEMA,
    schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
    id: 'monkey-show',
    name: 'Monkey Show',
    summary: 'Risk tooling for escrow, insurance, and bounty coordination.',
    description:
      'Money-market style coordination for Frontier crews: escrow flows, insurance pools, and bounty routing with on-chain proofs.',
    categories: ['money'],
    smartAssemblyTypes: ['gate'],
    serverTenant: 'stillness',
    liveUrl: 'https://monkey-show.example',
    repositoryUrl: 'https://github.com/example/monkey-show',
    documentationUrl: 'https://docs.monkey-show.example',
    suiPackages: [],
    media: {
      thumbnail: 'thumbnail',
      items: [
        {
          id: 'thumbnail',
          kind: 'image',
          role: 'thumbnail',
          uri: 'walrus://blob/dev-monkey-thumbnail',
          mimeType: 'image/jpeg',
          sha256: HEX_32,
          sizeBytes: 512_000,
          width: 1280,
          height: 720,
          alt: 'Monkey Show operations screen',
        },
        {
          id: 'logo',
          kind: 'image',
          role: 'logo',
          uri: 'walrus://blob/dev-monkey-logo',
          mimeType: 'image/png',
          sha256: HEX_32,
          sizeBytes: 32_000,
          width: 128,
          height: 128,
          alt: 'Monkey Show logo',
        },
        {
          id: 'gallery-detail',
          kind: 'image',
          role: 'gallery',
          uri: 'walrus://blob/dev-monkey-gallery-1',
          mimeType: 'image/webp',
          sha256: HEX_32,
          sizeBytes: 420_000,
          width: 1024,
          height: 562,
          alt: 'Monkey Show on-chain detail screenshot',
          caption: 'On-chain listing before Walrus metadata is loaded.',
        },
        {
          id: 'demo',
          kind: 'video',
          role: 'demo',
          poster: {
            uri: 'walrus://blob/dev-monkey-poster',
            mimeType: 'image/webp',
            sha256: HEX_32,
            sizeBytes: 220_000,
            width: 1280,
            height: 720,
            alt: 'Monkey Show demo poster',
          },
          sources: [
            {
              uri: 'walrus://blob/dev-monkey-demo',
              mimeType: DAPP_INDEX_VIDEO_MIME_TYPE,
              sha256: HEX_32,
              sizeBytes: 12_000_000,
              width: 1280,
              height: 720,
              durationSeconds: 36,
            },
          ],
          caption: 'Walkthrough of escrow and bounty routing flows.',
        },
      ],
    },
  },
];

export function applyDevCatalogFixtures(
  entries: readonly DappIndexEntry[],
): DappIndexEntry[] {
  if (!viteFixtureDataEnabled()) return [...entries];

  const merged = new Map(entries.map((entry) => [entry.id, entry]));
  for (const devEntry of DEV_CATALOG_FIXTURE_ENTRIES) {
    merged.set(devEntry.id, devEntry);
  }
  return [...merged.values()];
}
