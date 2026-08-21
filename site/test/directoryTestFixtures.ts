import {
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/constants';
import type { DappIndexEntry } from '@/types/dapp-index';

const HEX_32 = '0'.repeat(64);
const PACKAGE_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

/** Test-only directory entries; not used in production catalog loading. */
export function listDirectoryTestFixtures(): DappIndexEntry[] {
  return [
    {
      schema: DAPP_INDEX_METADATA_SCHEMA,
      schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
      id: 'frontier-library',
      name: 'Frontier Library',
      summary: 'Browse and share verified builder metadata for Frontier tools.',
      description:
        'A catalog and documentation hub for Frontier ecosystem dapps, with registry-backed listings and Walrus-hosted metadata.',
      tribe: 'Frontier Library Guild',
      riderName: 'Ada Builder',
      categories: ['build', 'intel'],
      smartAssemblyTypes: ['storage-unit'],
      serverTenant: 'stillness',
      liveUrl: 'https://frontier-library.example',
      repositoryUrl: 'https://github.com/example/frontier-library',
      documentationUrl: 'https://docs.frontier-library.example',
      suiPackages: [
        {
          network: 'testnet',
          packageId: PACKAGE_ID,
          role: 'core',
          mvrName: '@example/frontier-library',
          packageInfoId:
            '0x1111111111111111111111111111111111111111111111111111111111111111',
        },
      ],
      media: {
        thumbnail: 'dashboard',
        items: [
          {
            id: 'dashboard',
            kind: 'image',
            role: 'thumbnail',
            uri: 'walrus://blob/dashboardBlobId',
            mimeType: 'image/webp',
            sha256: HEX_32,
            sizeBytes: 824_512,
            width: 1600,
            height: 900,
            alt: 'Frontier Library dashboard',
          },
          {
            id: 'logo',
            kind: 'image',
            role: 'logo',
            uri: 'walrus://blob/logoBlobId',
            mimeType: 'image/png',
            sha256: HEX_32,
            sizeBytes: 48_000,
            width: 256,
            height: 256,
            alt: 'Frontier Library logo',
          },
          {
            id: 'catalog',
            kind: 'image',
            role: 'gallery',
            uri: 'walrus://blob/catalogBlobId',
            mimeType: 'image/webp',
            sha256: HEX_32,
            sizeBytes: 640_000,
            width: 1600,
            height: 900,
            alt: 'Frontier Library catalog view',
            caption: 'Browse verified listings from the catalog grid.',
          },
          {
            id: 'detail',
            kind: 'image',
            role: 'gallery',
            uri: 'walrus://blob/detailBlobId',
            mimeType: 'image/webp',
            sha256: HEX_32,
            sizeBytes: 580_000,
            width: 1600,
            height: 900,
            alt: 'Frontier Library detail page',
            caption: 'Detail pages surface registry-backed metadata and media.',
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
      suiPackages: [],
      media: {
        thumbnail: 'thumbnail',
        items: [
          {
            id: 'thumbnail',
            kind: 'image',
            role: 'thumbnail',
            uri: 'walrus://blob/monkeyHeroBlobId',
            mimeType: 'image/jpeg',
            sha256: HEX_32,
            sizeBytes: 512_000,
            width: 1280,
            height: 720,
            alt: 'Monkey Show operations screen',
          },
          {
            id: 'demo',
            kind: 'video',
            role: 'demo',
            uri: 'walrus://blob/monkeyDemoBlobId',
            mimeType: DAPP_INDEX_VIDEO_MIME_TYPE,
            sha256: HEX_32,
            sizeBytes: 4_500_000,
            width: 1280,
            height: 720,
            alt: 'Monkey Show escrow walkthrough',
            poster: {
              uri: 'walrus://blob/monkeyPosterBlobId',
              mimeType: 'image/webp',
              sha256: HEX_32,
              sizeBytes: 120_000,
              width: 1280,
              height: 720,
            },
            sources: [
              {
                uri: 'walrus://blob/monkeyDemoBlobId',
                mimeType: DAPP_INDEX_VIDEO_MIME_TYPE,
                sha256: HEX_32,
                sizeBytes: 4_500_000,
                width: 1280,
                height: 720,
                durationSeconds: 42,
              },
            ],
          },
        ],
      },
    },
  ];
}
