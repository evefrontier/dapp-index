import { describe, expect, test } from 'bun:test';
import type {
  DappIndexImageMediaItem,
  DappIndexMediaItem,
  DappIndexVideoMediaItem,
} from '../types/dapp-index';
import { validateRegistryMetadataJson } from './registryMetadata';

const HEX_32 = '0'.repeat(64);
const PACKAGE_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

function validMetadata() {
  return {
    schema: 'evefrontier.dapp-index.metadata',
    schemaVersion: 1,
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
    maintainer: {
      name: 'Example Builders',
      url: 'https://builders.example',
      contact: 'hello@builders.example',
    },
    suiPackages: [
      {
        network: 'testnet',
        packageId: PACKAGE_ID,
        role: 'core',
        modules: ['routes'],
        explorerUrl: `https://testnet.suivision.xyz/package/${PACKAGE_ID}`,
      },
    ],
    media: {
      thumbnail: 'dashboard',
      hero: 'dashboard',
      items: [
        {
          id: 'dashboard',
          kind: 'image',
          role: 'hero',
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
              mimeType: 'video/webm',
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

  test('rejects more than two videos', () => {
    const metadata = validMetadata();
    const videoItem = metadata.media.items[1] as DappIndexVideoMediaItem;
    metadata.media.items.push({ ...videoItem, id: 'demo-2' });
    metadata.media.items.push({ ...videoItem, id: 'demo-3' });

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

  test('rejects videos whose primary source is not WebM', () => {
    const metadata = validMetadata();
    (metadata.media.items[1] as DappIndexVideoMediaItem).sources.unshift({
      uri: 'walrus://blob/mp4BlobId',
      mimeType: 'video/mp4' as unknown as 'video/webm',
      codecs: 'h264,aac',
      sha256: HEX_32,
      sizeBytes: 20_000_000,
      width: 1920,
      height: 1080,
      durationSeconds: 42,
    });

    expect(validateRegistryMetadataJson(metadata).ok).toBe(false);
  });

  test('rejects MP4 fallback sources while public video support is WebM-only', () => {
    const metadata = validMetadata();
    (metadata.media.items[1] as DappIndexVideoMediaItem).sources.push({
      uri: 'walrus://blob/mp4BlobId',
      mimeType: 'video/mp4' as unknown as 'video/webm',
      codecs: 'h264,aac',
      sha256: HEX_32,
      sizeBytes: 20_000_000,
      width: 1920,
      height: 1080,
      durationSeconds: 42,
    });

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
