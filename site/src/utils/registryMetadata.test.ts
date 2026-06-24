import { describe, expect, test } from 'bun:test';
import type {
  DappIndexImageMediaItem,
  DappIndexMediaItem,
  DappIndexVideoMediaItem,
} from '../types/dapp-index';
import {
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/constants';
import { validateRegistryMetadataJson } from './registryMetadata';

const HEX_32 = '0'.repeat(64);
const PACKAGE_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

function validMetadata() {
  return {
    schema: DAPP_INDEX_METADATA_SCHEMA,
    schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
    id: 'route-planner',
    name: 'Route Planner',
    summary: 'Plan and share Frontier hauling routes.',
    description:
      'A route planning dapp for coordinating storage-unit and gate logistics.',
    categories: ['logistics', 'infrastructure'],
    smartAssemblyTypes: ['storage-unit', 'gate'],
    serverTenant: 'stillness',
    liveUrl: 'https://route-planner.example',
    repositoryUrl: 'https://github.com/example/route-planner',
    documentationUrl: 'https://docs.route-planner.example',
    suiPackages: [
      {
        network: 'testnet',
        packageId: PACKAGE_ID,
        role: 'core',
        mvrName: '@example/route-planner',
        packageInfoId:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        modules: ['routes'],
        explorerUrl: `https://testnet.suivision.xyz/package/${PACKAGE_ID}`,
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
          alt: 'Dashboard showing active storage routes',
          caption: 'Main operations dashboard',
        },
        {
          id: 'demo',
          kind: 'video',
          role: 'demo',
          poster: {
            uri: 'walrus://blob/posterBlobId',
            mimeType: 'image/webp',
            sha256: HEX_32,
            sizeBytes: 420_128,
            width: 1600,
            height: 900,
            alt: 'Route planner demo poster',
          },
          sources: [
            {
              uri: 'walrus://blob/webmBlobId',
              mimeType: DAPP_INDEX_VIDEO_MIME_TYPE,
              codecs: 'vp9,opus',
              sha256: HEX_32,
              sizeBytes: 41_839_200,
              width: 1920,
              height: 1080,
              durationSeconds: 42,
            },
          ],
          caption: 'Creating a route and handing it off to a fleet',
        },
      ] as DappIndexMediaItem[],
    },
    proofs: {
      domain: {
        url: 'https://route-planner.example/.well-known/eve-dapp-index.json',
      },
    },
    notes: 'Public listing media is hosted on Walrus.',
  };
}

describe('registry metadata media schema', () => {
  test('accepts a Walrus-hosted media gallery manifest', () => {
    expect(validateRegistryMetadataJson(validMetadata())).toEqual({ ok: true });
  });

  test('rejects external public media URLs', () => {
    const metadata = validMetadata();
    (metadata.media.items[0] as DappIndexImageMediaItem).uri =
      'https://cdn.example/dashboard.webp' as unknown as `walrus://blob/${string}`;

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects unsupported video formats', () => {
    const metadata = validMetadata();
    const src = (
      metadata.media.items[1] as DappIndexVideoMediaItem
    ).sources[0]!;
    (src as unknown as { mimeType: string }).mimeType = 'video/quicktime';

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects videos over the public listing limit', () => {
    const metadata = validMetadata();
    (metadata.media.items[1] as DappIndexVideoMediaItem).sources[0]!.sizeBytes =
      60_000_001;

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects gallery pointers that do not reference a media item', () => {
    const metadata = validMetadata();
    metadata.media.thumbnail = 'missing-image';

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects duplicate media IDs', () => {
    const metadata = validMetadata();
    metadata.media.items[1].id = 'dashboard';

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects more than one video', () => {
    const metadata = validMetadata();
    const videoItem = metadata.media.items[1] as DappIndexVideoMediaItem;
    metadata.media.items.push({ ...videoItem, id: 'demo-2' });

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects total public media over the listing budget', () => {
    const metadata = validMetadata();
    (metadata.media.items[0] as DappIndexImageMediaItem).sizeBytes = 5_000_000;
    const videoItem = metadata.media.items[1] as DappIndexVideoMediaItem;
    videoItem.poster.sizeBytes = 5_000_000;
    videoItem.sources[0]!.sizeBytes = 60_000_000;
    metadata.media.items.push({
      ...videoItem,
      id: 'demo-2',
      poster: {
        ...videoItem.poster,
        uri: 'walrus://blob/posterBlobId2',
      },
      sources: [
        {
          ...videoItem.sources[0]!,
          uri: 'walrus://blob/webmBlobId2',
        },
      ],
    });
    for (let i = 0; i < 5; i += 1) {
      metadata.media.items.push({
        ...(metadata.media.items[0] as DappIndexImageMediaItem),
        id: `gallery-${i}`,
        role: 'gallery',
        uri: `walrus://blob/galleryBlobId${i}`,
      } as DappIndexImageMediaItem);
    }

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects legacy thumbnailUrl metadata', () => {
    const metadata = {
      ...validMetadata(),
      thumbnailUrl: 'https://cdn.example/thumbnail.webp',
    };

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects legacy flat packageIds metadata', () => {
    const metadata = {
      ...validMetadata(),
      packageIds: [PACKAGE_ID],
    };

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects legacy string maintainer metadata', () => {
    const metadata = {
      ...validMetadata(),
      maintainer: 'Example Builders',
    };

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });
});
