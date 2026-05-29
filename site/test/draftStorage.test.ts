import { describe, expect, test } from 'bun:test';
import {
  DRAFT_STORAGE_KEY,
  DRAFT_STEPS,
  createDraftStorage,
  createMemoryDraftLocalMediaStore,
  createMemoryLocalStorage,
} from '../src/storage/draftStorage';
import { draft } from './draftTestUtils';

describe('draft storage', () => {
  test('stores draft fields in local storage', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    await storage.saveDraft(draft);

    expect(await storage.getDraft('draft-1')).toEqual(draft);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain(
      'frontier-map',
    );
  });

  test('updates draft fields without replacing workflow state or media', async () => {
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
      now: () => new Date('2026-05-18T12:15:00.000Z'),
    });

    await storage.saveDraft({
      ...draft,
      currentStep: 'metadata',
      completedSteps: ['profile'],
      media: [
        {
          id: 'screen-1',
          kind: 'screenshot',
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
    expect(updatedDraft.currentStep).toBe('metadata');
    expect(updatedDraft.completedSteps).toEqual(['profile']);
    expect(updatedDraft.media.map((item) => item.id)).toEqual(['screen-1']);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T12:15:00.000Z');
  });

  test('restores legacy drafts with default workflow state', async () => {
    const localStorage = createMemoryLocalStorage();
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
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    expect(await storage.getDraft('draft-1')).toEqual({
      id: 'draft-1',
      status: 'draft',
      currentStep: 'profile',
      completedSteps: [],
      createdAt: '2026-05-18T12:00:00.000Z',
      updatedAt: '2026-05-18T12:00:00.000Z',
      fields: { id: 'frontier-map' },
      media: [],
    });
  });

  test('normalizes invalid persisted workflow state', async () => {
    const localStorage = createMemoryLocalStorage();
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        'draft-1': {
          id: 'draft-1',
          status: 'not-a-status',
          currentStep: 'not-a-step',
          completedSteps: ['profile', 'bad-step', 'media'],
          createdAt: '2026-05-18T12:00:00.000Z',
          updatedAt: '2026-05-18T12:00:00.000Z',
          fields: { id: 'frontier-map' },
          media: [],
        },
      }),
    );
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    const restoredDraft = await storage.getDraft('draft-1');

    expect(restoredDraft?.status).toBe('draft');
    expect(restoredDraft?.currentStep).toBe('profile');
    expect(restoredDraft?.completedSteps).toEqual(['profile', 'media']);
  });

  test('keeps existing draft metadata when field persistence fails', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    await storage.saveDraft(draft);
    const failingStorage = createDraftStorage({
      localStorage: {
        getItem: localStorage.getItem,
        removeItem: localStorage.removeItem,
        setItem: () => {
          throw new Error('quota exceeded');
        },
      },
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    await expect(
      failingStorage.updateDraftFields('draft-1', {
        name: 'Unsaved name',
      }),
    ).rejects.toThrow('quota exceeded');
    expect(await storage.getDraft('draft-1')).toEqual(draft);
  });

  test('moves drafts between registration steps', async () => {
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
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
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
      now: () => new Date('2026-05-18T12:45:00.000Z'),
    });

    await storage.saveDraft({
      ...draft,
      completedSteps: ['profile'],
    });
    const updatedDraft = await storage.completeDraftStep(
      'draft-1',
      'metadata',
      'media',
    );

    expect(updatedDraft.currentStep).toBe('media');
    expect(updatedDraft.completedSteps).toEqual(['profile', 'metadata']);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T12:45:00.000Z');
  });

  test('stores publish checkpoints on the draft', async () => {
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
      now: () => new Date('2026-05-18T13:00:00.000Z'),
    });

    await storage.saveDraft(draft);
    await storage.savePublishCheckpoint('draft-1', {
      walrusBlobId: 'blob-1',
      walrusUrl: 'walrus://blob-1',
      metadataHash: 'abc123',
    });
    const updatedDraft = await storage.savePublishCheckpoint('draft-1', {
      suiTransactionDigest: 'tx-1',
    });

    expect(updatedDraft.publish).toEqual({
      walrusBlobId: 'blob-1',
      walrusUrl: 'walrus://blob-1',
      metadataHash: 'abc123',
      suiTransactionDigest: 'tx-1',
    });
    expect(updatedDraft.updatedAt).toBe('2026-05-18T13:00:00.000Z');
  });

  test('stores local media content separately from draft JSON', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    const content = new Blob(['webm-data'], { type: 'video/webm' });

    await storage.saveDraft(draft);
    const media = await storage.saveMedia('draft-1', {
      id: 'trailer',
      kind: 'video',
      name: 'trailer.webm',
    }, content);

    const savedDraft = await storage.getDraft('draft-1');
    const savedContent = await storage.getLocalMedia('draft-1', 'trailer');

    expect(media.mimeType).toBe('video/webm');
    expect(media.size).toBe(9);
    expect(savedDraft?.media).toEqual([media]);
    expect(savedContent).toEqual(content);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toContain(
      'webm-data',
    );
  });

  test('restores replaced media metadata when local media storage fails', async () => {
    let putCount = 0;
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: {
        put: async () => {
          putCount += 1;
          if (putCount > 1) {
            throw new Error('put failed');
          }
        },
        get: async () => null,
        deleteDraft: async () => {},
        clear: async () => {},
      },
    });

    await storage.saveDraft(draft);
    const originalMedia = await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'original.png',
    }, new Blob(['original'], { type: 'image/png' }));

    await expect(
      storage.saveMedia('draft-1', {
        id: 'screen-1',
        kind: 'screenshot',
        name: 'replacement.png',
      }, new Blob(['replacement'], { type: 'image/png' })),
    ).rejects.toThrow('put failed');

    expect((await storage.getDraft('draft-1'))?.media).toEqual([originalMedia]);
  });

  test('rejects MIME overrides that do not match the local media content MIME type', async () => {
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    await storage.saveDraft(draft);

    await expect(
      storage.saveMedia(
        'draft-1',
        {
          id: 'screen-1',
          kind: 'screenshot',
          name: 'screen.png',
          mimeType: 'image/jpeg',
        },
        new Blob(['image-data'], { type: 'image/png' }),
      ),
    ).rejects.toThrow('Provided media MIME type does not match the local media content MIME type.');
  });

  test('clears draft metadata and local media after publish succeeds', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    await storage.saveDraft(draft);
    await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'screen.png',
    }, new Blob(['image-data'], { type: 'image/png' }));

    await storage.clearPublishedDraft('draft-1');

    expect(await storage.getDraft('draft-1')).toBeNull();
    expect(await storage.getLocalMedia('draft-1', 'screen-1')).toBeNull();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  test('removes local draft storage key when the last draft is deleted', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    await storage.saveDraft(draft);
    await storage.deleteDraft('draft-1');

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  test('does not lose concurrent media saves for the same draft', async () => {
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    await storage.saveDraft(draft);
    await Promise.all([
      storage.saveMedia(
        'draft-1',
        { id: 'screen-1', kind: 'screenshot', name: 'screen-1.png' },
        new Blob(['image-data-1'], { type: 'image/png' }),
      ),
      storage.saveMedia(
        'draft-1',
        { id: 'screen-2', kind: 'screenshot', name: 'screen-2.png' },
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
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: {
        put: async () => {},
        get: async () => null,
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
    const localStorage = createMemoryLocalStorage();
    const storage = createDraftStorage({
      localStorage,
      localMediaStore: {
        put: async () => {},
        get: async () => null,
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
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });

    const protoDraft = {
      ...draft,
      id: '__proto__',
    };
    await storage.saveDraft(protoDraft);

    expect(await storage.getDraft('__proto__')).toEqual(protoDraft);
    expect(await storage.getDraft('toString')).toBeNull();
  });
});
