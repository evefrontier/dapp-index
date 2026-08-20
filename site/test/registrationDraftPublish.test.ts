import { describe, expect, test } from 'bun:test';
import { hexToBytes } from '../src/chain/bytes';
import {
  buildRegistrationPublishMetadata,
  createRegistrationPublishReadiness,
  getDraftVideoPosterBlockers,
  getPublishNextBlockerMessage,
  getReusableS3StorageUri,
  resolvePublishedMetadataPublicUrl,
  resolveRegistrationPublishAction,
} from '../src/builder/registrationDraftPublish';
import type { DraftMedia } from '../src/storage/draftStorage';

const baseMetadata = {
  schema: 'evefrontier.dapp-index.metadata',
  schemaVersion: 1,
  id: 'frontier-map',
  name: 'Frontier Map',
  summary: 'Maps routes and gate networks.',
  categories: ['commerce', 'intel'],
  liveUrl: 'https://frontier-map.example',
  serverTenant: 'stillness',
};

const imageMedia: DraftMedia = {
  id: 'dashboard',
  kind: 'screenshot',
  role: 'thumbnail',
  name: 'dashboard.webp',
  mimeType: 'image/webp',
  size: 824_512,
  createdAt: '2026-05-18T12:00:00.000Z',
  alt: 'Dashboard showing active storage routes',
  caption: 'Main operations dashboard',
};

const videoMedia: DraftMedia = {
  id: 'demo',
  kind: 'video',
  role: 'demo',
  name: 'demo.webm',
  mimeType: 'video/webm',
  size: 4_200_000,
  createdAt: '2026-05-18T12:05:00.000Z',
  caption: 'Creating a route and handing it off to a fleet',
};

describe('registration draft publish', () => {
  test('builds final metadata with HTTPS media references', () => {
    const result = buildRegistrationPublishMetadata({
      baseMetadata,
      mediaAssets: [
        {
          media: imageMedia,
          storageUri: 'https://cdn.example/testnet/0x/demo/dashboard.webp',
          sha256: '0'.repeat(64),
          sizeBytes: 824_512,
          width: 1600,
          height: 900,
        },
        {
          media: videoMedia,
          storageUri: 'https://cdn.example/testnet/0x/demo/demo.webm',
          sha256: '1'.repeat(64),
          sizeBytes: 4_200_000,
          width: 1920,
          height: 1080,
          durationSeconds: 42,
        },
      ],
    });

    expect(result.issues).toEqual([]);
    expect(result.metadata).toMatchObject({
      ...baseMetadata,
      media: {
        thumbnail: 'dashboard',
        items: [
          {
            id: 'dashboard',
            kind: 'image',
            role: 'thumbnail',
            uri: 'https://cdn.example/testnet/0x/demo/dashboard.webp',
            mimeType: 'image/webp',
            sha256: '0'.repeat(64),
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
              uri: 'https://cdn.example/testnet/0x/demo/dashboard.webp',
              mimeType: 'image/webp',
              sha256: '0'.repeat(64),
              sizeBytes: 824_512,
              width: 1600,
              height: 900,
              alt: 'Dashboard showing active storage routes',
              caption: 'Main operations dashboard',
            },
            sources: [
              {
                uri: 'https://cdn.example/testnet/0x/demo/demo.webm',
                mimeType: 'video/webm',
                sha256: '1'.repeat(64),
                sizeBytes: 4_200_000,
                width: 1920,
                height: 1080,
                durationSeconds: 42,
              },
            ],
            caption: 'Creating a route and handing it off to a fleet',
          },
        ],
      },
    });
  });

  test('blocks video publish when no uploaded image can be used as a poster', () => {
    const result = buildRegistrationPublishMetadata({
      baseMetadata,
      mediaAssets: [
        {
          media: videoMedia,
          storageUri: 'https://cdn.example/testnet/0x/demo/demo.webm',
          sha256: '1'.repeat(64),
          sizeBytes: 4_200_000,
          width: 1920,
          height: 1080,
          durationSeconds: 42,
        },
      ],
    });

    expect(result.ready).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        id: 'media.videoPoster',
        severity: 'error',
      }),
    ]);
  });

  test('reuses only valid S3 media checkpoints', () => {
    expect(
      getReusableS3StorageUri({
        storageUri: 'https://cdn.example/demo/dashboard.webp',
      }),
    ).toBe('https://cdn.example/demo/dashboard.webp');
    expect(getReusableS3StorageUri({})).toBeNull();
    expect(
      getReusableS3StorageUri({ storageUri: 'http://cdn.example/demo.webp' }),
    ).toBeNull();
  });

  test('restores the public URL from legacy published Walrus drafts', () => {
    expect(
      resolvePublishedMetadataPublicUrl({
        walrusUrl: 'https://aggregator.example/v1/blobs/abc123',
      }),
    ).toBe('https://aggregator.example/v1/blobs/abc123');
    expect(
      resolvePublishedMetadataPublicUrl({
        storageUri: 'https://cdn.example/demo/metadata.json',
        walrusUrl: 'https://aggregator.example/v1/blobs/abc123',
      }),
    ).toBe('https://cdn.example/demo/metadata.json');
  });

  test('chooses register for available slugs and update for owned slugs', () => {
    expect(
      resolveRegistrationPublishAction({
        slugCheck: {
          status: 'available',
          checkedSlug: 'frontier-map',
          message: 'Slug is available.',
        },
        walletAddress:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    ).toEqual({ ok: true, action: 'register' });

    expect(
      resolveRegistrationPublishAction({
        slugCheck: {
          status: 'taken',
          checkedSlug: 'frontier-map',
          owner:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          message: 'Owned by connected wallet.',
        },
        walletAddress:
          '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      }),
    ).toEqual({ ok: true, action: 'update' });
  });

  test('blocks publish when slug is owned by another wallet', () => {
    expect(
      resolveRegistrationPublishAction({
        slugCheck: {
          status: 'taken',
          checkedSlug: 'frontier-map',
          owner:
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          message: 'Owned by another wallet.',
        },
        walletAddress:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    ).toEqual({
      ok: false,
      message: 'Slug is already owned by another wallet.',
    });
  });

  test('converts metadata hash hex to transaction bytes', () => {
    expect(hexToBytes('00ff10')).toEqual(new Uint8Array([0, 255, 16]));
    expect(() => hexToBytes('0ff')).toThrow('even number');
    expect(() => hexToBytes('zz')).toThrow('valid hex');
  });

  test('summarizes publish readiness blockers before wallet actions', () => {
    expect(
      createRegistrationPublishReadiness({
        registryConfigured: false,
        reviewReady: false,
        suiNetwork: 'devnet',
        walletAddress: null,
        uploadApiBase: null,
      }),
    ).toEqual({
      ready: false,
      blockers: [
        'Fix review blockers first.',
        'Connect a wallet to publish.',
        'Configure registry package and object env vars.',
        'Publish supports testnet or mainnet.',
        'Configure VITE_UPLOAD_API_BASE for media uploads.',
      ],
    });

    expect(
      createRegistrationPublishReadiness({
        registryConfigured: true,
        reviewReady: true,
        suiNetwork: 'testnet',
        walletAddress:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        uploadApiBase: 'https://uploads.example.com',
      }),
    ).toEqual({
      ready: true,
      blockers: [],
    });
  });

  test('includes wallet balance blockers in publish readiness', () => {
    expect(
      createRegistrationPublishReadiness({
        registryConfigured: true,
        reviewReady: true,
        suiNetwork: 'testnet',
        walletAddress:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        walletNetwork: 'testnet',
        uploadApiBase: 'https://uploads.example.com',
        walletBalanceBlockers: ['Add at least 0.05 SUI for gas and registry fees.'],
      }),
    ).toEqual({
      ready: false,
      blockers: ['Add at least 0.05 SUI for gas and registry fees.'],
    });
  });

  test('returns the first publish blocker for inline UI copy', () => {
    const readiness = createRegistrationPublishReadiness({
      registryConfigured: true,
      reviewReady: false,
      suiNetwork: 'testnet',
      walletAddress: null,
      uploadApiBase: 'https://uploads.example.com',
    });

    expect(getPublishNextBlockerMessage(readiness)).toBe(
      'Fix review blockers first.',
    );
    expect(
      getPublishNextBlockerMessage(
        createRegistrationPublishReadiness({
          registryConfigured: true,
          reviewReady: true,
          suiNetwork: 'testnet',
          walletAddress:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          walletNetwork: 'testnet',
          uploadApiBase: 'https://uploads.example.com',
        }),
      ),
    ).toBeNull();
    expect(
      getPublishNextBlockerMessage(readiness, { isPublishing: true }),
    ).toBeNull();
  });
});
