import { describe, expect, test } from 'bun:test';
import {
  DRAFT_STORAGE_KEY,
  DRAFT_STEPS,
  isDraftStep,
  parseDraftStep,
} from '../src/storage/draftStorage';
import { createTestDraftStorage, draft } from './draftTestUtils';

describe('draft storage', () => {
  test('declares the full builder listing wizard step order', () => {
    expect(DRAFT_STEPS).toEqual([
      'basics',
      'about',
      'discovery',
      'packages',
      'media',
      'review',
      'publish',
    ]);
  });

  test('parses persisted step values before using them as draft steps', () => {
    expect(isDraftStep('about')).toBe(true);
    expect(parseDraftStep('about')).toBe('about');
    expect(isDraftStep('media')).toBe(true);
    expect(parseDraftStep('publish')).toBe('publish');
    expect(isDraftStep('not-a-step')).toBe(false);
    expect(parseDraftStep('not-a-step')).toBeNull();
    expect(parseDraftStep(42)).toBeNull();
  });

  test('stores draft fields in local storage', async () => {
    const { localStorage, storage } = createTestDraftStorage();

    await storage.saveDraft(draft);

    expect(await storage.getDraft('draft-1')).toEqual(draft);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain(
      'frontier-map',
    );
  });

  test('updates draft fields without replacing workflow state or media', async () => {
    const { storage } = createTestDraftStorage({
      now: () => new Date('2026-05-18T12:15:00.000Z'),
    });

    await storage.saveDraft({
      ...draft,
      currentStep: 'about',
      completedSteps: ['basics'],
      media: [
        {
          id: 'screen-1',
          kind: 'screenshot',
          role: 'gallery',
          name: 'screen.png',
          mimeType: 'image/png',
          size: 10,
          createdAt: '2026-05-18T12:05:00.000Z',
        },
      ],
    });

    const updatedDraft = await storage.updateDraftFields('draft-1', {
      name: 'Updated Frontier Map',
      summary: 'A route planning dapp.',
    });

    expect(updatedDraft.fields).toEqual({
      id: 'frontier-map',
      name: 'Updated Frontier Map',
      summary: 'A route planning dapp.',
    });
    expect(updatedDraft.currentStep).toBe('about');
    expect(updatedDraft.completedSteps).toEqual(['basics']);
    expect(updatedDraft.media.map((item) => item.id)).toEqual(['screen-1']);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T12:15:00.000Z');
  });

  test('restores incomplete persisted drafts with default workflow state', async () => {
    const { localStorage, storage } = createTestDraftStorage();
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        'draft-1': {
          id: 'draft-1',
          status: 'draft',
          createdAt: '2026-05-18T12:00:00.000Z',
          updatedAt: '2026-05-18T12:00:00.000Z',
          fields: { id: 'frontier-map' },
          media: [],
        },
      }),
    );

    expect(await storage.getDraft('draft-1')).toEqual({
      id: 'draft-1',
      status: 'draft',
      currentStep: 'basics',
      completedSteps: [],
      createdAt: '2026-05-18T12:00:00.000Z',
      updatedAt: '2026-05-18T12:00:00.000Z',
      fields: { id: 'frontier-map' },
      media: [],
    });
  });

  test('retains legacy Walrus publish checkpoints for compatibility', async () => {
    const { localStorage, storage } = createTestDraftStorage();
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        'draft-1': {
          ...draft,
          status: 'published',
          publish: {
            metadataUri: 'walrus://blob/metadata-blob',
            metadataHash: 'abc123',
            walrusBlobId: 'metadata-blob',
            walrusUrl: 'https://aggregator.example/v1/blobs/metadata-blob',
            suiTransactionDigest: 'tx-1',
            media: [
              {
                mediaId: 'dashboard',
                walrusBlobId: 'media-blob',
                walrusUrl: 'https://aggregator.example/v1/blobs/media-blob',
                sha256: '0'.repeat(64),
                sizeBytes: 824_512,
                width: 1600,
                height: 900,
              },
            ],
          },
        },
      }),
    );

    const restoredDraft = await storage.getDraft('draft-1');

    expect(restoredDraft?.publish?.walrusUrl).toBe(
      'https://aggregator.example/v1/blobs/metadata-blob',
    );
    expect(restoredDraft?.publish?.media?.[0]?.storageUri).toBeUndefined();
    expect(restoredDraft?.publish?.media?.[0]?.walrusBlobId).toBe('media-blob');
  });

  test('normalizes invalid persisted workflow state', async () => {
    const { localStorage, storage } = createTestDraftStorage();
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        'draft-1': {
          id: 'draft-1',
          status: 'not-a-status',
          currentStep: 'not-a-step',
          completedSteps: [
            'basics',
            'bad-step',
            'basics',
            'media',
            'media',
          ],
          createdAt: '2026-05-18T12:00:00.000Z',
          updatedAt: '2026-05-18T12:00:00.000Z',
          fields: { id: 'frontier-map' },
          media: [],
        },
      }),
    );
    const restoredDraft = await storage.getDraft('draft-1');

    expect(restoredDraft?.status).toBe('draft');
    expect(restoredDraft?.currentStep).toBe('basics');
    expect(restoredDraft?.completedSteps).toEqual(['basics', 'media']);
  });

  test('keeps existing draft metadata when field persistence fails', async () => {
    const { localStorage, storage } = createTestDraftStorage();
    await storage.saveDraft(draft);
    const { storage: failingStorage } = createTestDraftStorage({
      localStorage: {
        getItem: localStorage.getItem,
        removeItem: localStorage.removeItem,
        setItem: () => {
          throw new Error('quota exceeded');
        },
      },
    });

    await expect(
      failingStorage.updateDraftFields('draft-1', {
        name: 'Unsaved name',
      }),
    ).rejects.toThrow('quota exceeded');
    expect(await storage.getDraft('draft-1')).toEqual(draft);
  });

  test('moves drafts between registration steps', async () => {
    const { storage } = createTestDraftStorage({
      now: () => new Date('2026-05-18T12:30:00.000Z'),
    });

    await storage.saveDraft(draft);
    const updatedDraft = await storage.setDraftStep('draft-1', 'media');

    expect(DRAFT_STEPS).toContain('media');
    expect(updatedDraft.currentStep).toBe('media');
    expect(updatedDraft.completedSteps).toEqual([]);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T12:30:00.000Z');
  });

  test('marks steps complete and advances to the next step', async () => {
    const { storage } = createTestDraftStorage({
      now: () => new Date('2026-05-18T12:45:00.000Z'),
    });

    await storage.saveDraft({
      ...draft,
      completedSteps: ['basics'],
    });
    const updatedDraft = await storage.completeDraftStep(
      'draft-1',
      'about',
      'discovery',
    );

    expect(updatedDraft.currentStep).toBe('discovery');
    expect(updatedDraft.completedSteps).toEqual(['basics', 'about']);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T12:45:00.000Z');
  });

  test('stores publish checkpoints on the draft', async () => {
    const { storage } = createTestDraftStorage({
      now: () => new Date('2026-05-18T13:00:00.000Z'),
    });

    await storage.saveDraft(draft);
    await storage.savePublishCheckpoint('draft-1', {
      media: [
        {
          mediaId: 'dashboard',
          storageUri: 'https://cdn.example/testnet/0x/demo/dashboard.webp',
          sha256: '0'.repeat(64),
          sizeBytes: 824_512,
          width: 1600,
          height: 900,
        },
      ],
      metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      storageUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      metadataHash: 'abc123',
    });
    const updatedDraft = await storage.savePublishCheckpoint('draft-1', {
      suiTransactionDigest: 'tx-1',
    });

    expect(updatedDraft.publish).toEqual({
      media: [
        {
          mediaId: 'dashboard',
          storageUri: 'https://cdn.example/testnet/0x/demo/dashboard.webp',
          sha256: '0'.repeat(64),
          sizeBytes: 824_512,
          width: 1600,
          height: 900,
        },
      ],
      metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      storageUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      metadataHash: 'abc123',
      suiTransactionDigest: 'tx-1',
    });
    expect(updatedDraft.updatedAt).toBe('2026-05-18T13:00:00.000Z');
  });

  test('stores local media content separately from draft JSON', async () => {
    const { localStorage, storage } = createTestDraftStorage();
    const content = new Blob(['webm-data'], { type: 'video/webm' });

    await storage.saveDraft(draft);
    const media = await storage.saveMedia('draft-1', {
      id: 'trailer',
      kind: 'video',
      name: 'trailer.webm',
      role: 'demo',
      alt: '   ',
      caption: 'Launch trailer',
    }, content);

    const savedDraft = await storage.getDraft('draft-1');
    const savedContent = await storage.getLocalMedia('draft-1', 'trailer');

    expect(media.mimeType).toBe('video/webm');
    expect(media.role).toBe('demo');
    expect(media.alt).toBeUndefined();
    expect(media.caption).toBe('Launch trailer');
    expect(media.size).toBe(9);
    expect(savedDraft?.media).toEqual([media]);
    expect(savedContent).toEqual(content);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toContain(
      'webm-data',
    );
  });

  test('updates media metadata without replacing local content', async () => {
    const { storage } = createTestDraftStorage({
      now: () => new Date('2026-05-18T13:15:00.000Z'),
    });
    const content = new Blob(['image-data'], { type: 'image/png' });

    await storage.saveDraft(draft);
    await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'screen.png',
      role: 'gallery',
    }, content);
    const updatedDraft = await storage.updateMedia('draft-1', 'screen-1', {
      role: 'thumbnail',
      alt: 'Route planner dashboard',
      caption: 'Live route planning view',
    });

    expect(updatedDraft.media).toEqual([
      expect.objectContaining({
        id: 'screen-1',
        role: 'thumbnail',
        alt: 'Route planner dashboard',
        caption: 'Live route planning view',
      }),
    ]);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T13:15:00.000Z');
    expect(await storage.getLocalMedia('draft-1', 'screen-1')).toEqual(
      content,
    );
  });

  test('normalizes whitespace-only alt text when updating media metadata', async () => {
    const { storage } = createTestDraftStorage();
    const content = new Blob(['image-data'], { type: 'image/png' });

    await storage.saveDraft(draft);
    await storage.saveMedia(
      'draft-1',
      {
        id: 'screen-1',
        kind: 'screenshot',
        name: 'screen.png',
        role: 'gallery',
      },
      content,
    );

    const updatedDraft = await storage.updateMedia('draft-1', 'screen-1', {
      alt: '   ',
    });

    expect(updatedDraft.media[0]?.alt).toBeUndefined();
  });

  test('drops draft media entries with invalid size values from persisted storage', async () => {
    const { localStorage, storage } = createTestDraftStorage();

    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        'draft-1': {
          ...draft,
          media: [
            {
              id: 'bad-size',
              kind: 'screenshot',
              role: 'gallery',
              name: 'bad.png',
              mimeType: 'image/png',
              size: Number.NaN,
              createdAt: '2026-05-18T12:00:00.000Z',
            },
            {
              id: 'negative-size',
              kind: 'screenshot',
              role: 'gallery',
              name: 'negative.png',
              mimeType: 'image/png',
              size: -1,
              createdAt: '2026-05-18T12:00:00.000Z',
            },
            {
              id: 'valid',
              kind: 'screenshot',
              role: 'gallery',
              name: 'good.png',
              mimeType: 'image/png',
              size: 1024,
              createdAt: '2026-05-18T12:00:00.000Z',
              alt: '   ',
            },
          ],
        },
      }),
    );

    const loadedDraft = await storage.getDraft('draft-1');

    expect(loadedDraft?.media).toEqual([
      expect.objectContaining({
        id: 'valid',
        size: 1024,
        alt: undefined,
      }),
    ]);
  });

  test('keeps thumbnail and logo media roles exclusive', async () => {
    const { storage } = createTestDraftStorage();

    await storage.saveDraft(draft);
    await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'screen-1.png',
      role: 'thumbnail',
    }, new Blob(['image-data-1'], { type: 'image/png' }));
    await storage.saveMedia('draft-1', {
      id: 'screen-2',
      kind: 'screenshot',
      name: 'screen-2.png',
      role: 'logo',
    }, new Blob(['image-data-2'], { type: 'image/png' }));

    const updatedDraft = await storage.updateMedia('draft-1', 'screen-2', {
      role: 'thumbnail',
    });

    expect(
      updatedDraft.media.map(({ id, role }) => ({ id, role })).sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    ).toEqual([
      { id: 'screen-1', role: 'gallery' },
      { id: 'screen-2', role: 'thumbnail' },
    ]);
  });

  test('deletes draft media metadata and local content together', async () => {
    const { storage } = createTestDraftStorage();

    await storage.saveDraft(draft);
    await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'screen.png',
      role: 'gallery',
    }, new Blob(['image-data'], { type: 'image/png' }));

    const updatedDraft = await storage.deleteMedia('draft-1', 'screen-1');

    expect(updatedDraft.media).toEqual([]);
    expect(await storage.getLocalMedia('draft-1', 'screen-1')).toBeNull();
  });

  test('restores replaced media metadata when local media storage fails on saveMedia', async () => {
    let putCount = 0;
    const { storage } = createTestDraftStorage({
      localMediaStore: {
        put: async () => {
          putCount += 1;
          if (putCount > 1) {
            throw new Error('put failed');
          }
        },
        get: async () => null,
        delete: async () => {},
        deleteDraft: async () => {},
        clear: async () => {},
      },
    });

    await storage.saveDraft(draft);
    const originalMedia = await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'original.png',
      role: 'gallery',
    }, new Blob(['original'], { type: 'image/png' }));

    await expect(
      storage.saveMedia('draft-1', {
        id: 'screen-1',
        kind: 'screenshot',
        name: 'replacement.png',
        role: 'gallery',
      }, new Blob(['replacement'], { type: 'image/png' })),
    ).rejects.toThrow('put failed');

    expect((await storage.getDraft('draft-1'))?.media).toEqual([originalMedia]);
  });

  test('rejects MIME overrides that do not match the local media content MIME type', async () => {
    const { storage } = createTestDraftStorage();

    await storage.saveDraft(draft);

    await expect(
      storage.saveMedia(
        'draft-1',
        {
          id: 'screen-1',
          kind: 'screenshot',
          name: 'screen.png',
          mimeType: 'image/jpeg',
          role: 'gallery',
        },
        new Blob(['image-data'], { type: 'image/png' }),
      ),
    ).rejects.toThrow('Provided media MIME type does not match the local media content MIME type.');
  });

  test('finalizePublishedDraft marks draft published and keeps local media', async () => {
    const { storage } = createTestDraftStorage();

    await storage.saveDraft(draft);
    await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'screen.png',
      role: 'gallery',
    }, new Blob(['image-data'], { type: 'image/png' }));

    const publishedDraft = await storage.finalizePublishedDraft('draft-1', {
      suiTransactionDigest: 'digest-1',
      metadataHash: 'hash-1',
      metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
      storageUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
    });

    expect(publishedDraft.status).toBe('published');
    expect(publishedDraft.currentStep).toBe('publish');
    expect(publishedDraft.completedSteps).toContain('publish');
    expect(publishedDraft.publish).toMatchObject({
      suiTransactionDigest: 'digest-1',
      metadataUri: 'https://cdn.example/testnet/0x/demo/metadata.json',
    });

    const reloaded = await storage.getDraft('draft-1');
    expect(reloaded?.status).toBe('published');
    expect(await storage.getLocalMedia('draft-1', 'screen-1')).not.toBeNull();
  });

  test('removes local draft storage key when the last draft is deleted', async () => {
    const { localStorage, storage } = createTestDraftStorage();

    await storage.saveDraft(draft);
    await storage.deleteDraft('draft-1');

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  test('does not lose concurrent media saves for the same draft', async () => {
    const { storage } = createTestDraftStorage();

    await storage.saveDraft(draft);
    await Promise.all([
      storage.saveMedia(
        'draft-1',
        { id: 'screen-1', kind: 'screenshot', name: 'screen-1.png', role: 'gallery' },
        new Blob(['image-data-1'], { type: 'image/png' }),
      ),
      storage.saveMedia(
        'draft-1',
        { id: 'screen-2', kind: 'screenshot', name: 'screen-2.png', role: 'gallery' },
        new Blob(['image-data-2'], { type: 'image/png' }),
      ),
    ]);

    const savedDraft = await storage.getDraft('draft-1');
    expect(savedDraft?.media.map((item) => item.id).sort()).toEqual([
      'screen-1',
      'screen-2',
    ]);
  });

  test('keeps draft metadata when deleting local media content fails', async () => {
    const { storage } = createTestDraftStorage({
      localMediaStore: {
        put: async () => {},
        get: async () => null,
        delete: async () => {},
        deleteDraft: async () => {
          throw new Error('delete failed');
        },
        clear: async () => {},
      },
    });

    await storage.saveDraft(draft);

    await expect(storage.deleteDraft('draft-1')).rejects.toThrow('delete failed');
    expect(await storage.getDraft('draft-1')).toEqual(draft);
  });

  test('keeps draft metadata when clearing local media content fails', async () => {
    const { localStorage, storage } = createTestDraftStorage({
      localMediaStore: {
        put: async () => {},
        get: async () => null,
        delete: async () => {},
        deleteDraft: async () => {},
        clear: async () => {
          throw new Error('clear failed');
        },
      },
    });

    await storage.saveDraft(draft);

    await expect(storage.clearDrafts()).rejects.toThrow('clear failed');
    expect(await storage.getDraft('draft-1')).toEqual(draft);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain(
      'frontier-map',
    );
  });

  test('supports prototype-like draft IDs safely', async () => {
    const { storage } = createTestDraftStorage();

    const protoDraft = {
      ...draft,
      id: '__proto__',
    };
    await storage.saveDraft(protoDraft);

    expect(await storage.getDraft('__proto__')).toEqual(protoDraft);
    expect(await storage.getDraft('toString')).toBeNull();
  });
});
