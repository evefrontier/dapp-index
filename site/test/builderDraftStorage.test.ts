import { describe, expect, test } from 'bun:test';
import {
  BUILDER_DRAFTS_STORAGE_KEY,
  BUILDER_DRAFT_STEPS,
  MAX_BUILDER_DRAFT_SCREENSHOT_BYTES,
  MAX_BUILDER_DRAFT_VIDEO_BYTES,
  createBuilderDraftAutosave,
  createBuilderDraftStorage,
  createMemoryBuilderDraftMediaStore,
  createMemoryLocalStorage,
  validateBuilderDraftMediaFile,
  type BuilderDraft,
} from '../src/builder/draftStorage';

const draft: BuilderDraft = {
  id: 'draft-1',
  status: 'draft',
  currentStep: 'profile',
  completedSteps: [],
  createdAt: '2026-05-18T12:00:00.000Z',
  updatedAt: '2026-05-18T12:00:00.000Z',
  fields: {
    id: 'frontier-map',
    name: 'Frontier Map',
  },
  media: [],
};

function blobLike(input: { size: number; type: string }): Blob {
  return input as Blob;
}

describe('builder draft storage', () => {
  test('stores draft fields in local storage', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    await storage.saveDraft(draft);

    expect(await storage.getDraft('draft-1')).toEqual(draft);
    expect(localStorage.getItem(BUILDER_DRAFTS_STORAGE_KEY)).toContain(
      'frontier-map',
    );
  });

  test('updates draft fields without replacing workflow state or media', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
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
      BUILDER_DRAFTS_STORAGE_KEY,
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
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
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
      BUILDER_DRAFTS_STORAGE_KEY,
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
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    const restoredDraft = await storage.getDraft('draft-1');

    expect(restoredDraft?.status).toBe('draft');
    expect(restoredDraft?.currentStep).toBe('profile');
    expect(restoredDraft?.completedSteps).toEqual(['profile', 'media']);
  });

  test('keeps existing draft metadata when field persistence fails', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    await storage.saveDraft(draft);
    const failingStorage = createBuilderDraftStorage({
      localStorage: {
        getItem: localStorage.getItem,
        removeItem: localStorage.removeItem,
        setItem: () => {
          throw new Error('quota exceeded');
        },
      },
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    await expect(
      failingStorage.updateDraftFields('draft-1', {
        name: 'Unsaved name',
      }),
    ).rejects.toThrow('quota exceeded');
    expect(await storage.getDraft('draft-1')).toEqual(draft);
  });

  test('moves drafts between registration steps', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
      now: () => new Date('2026-05-18T12:30:00.000Z'),
    });

    await storage.saveDraft(draft);
    const updatedDraft = await storage.setDraftStep('draft-1', 'media');

    expect(BUILDER_DRAFT_STEPS).toContain('media');
    expect(updatedDraft.currentStep).toBe('media');
    expect(updatedDraft.completedSteps).toEqual([]);
    expect(updatedDraft.updatedAt).toBe('2026-05-18T12:30:00.000Z');
  });

  test('marks steps complete and advances to the next step', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
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
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
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

  test('stores media blobs separately from draft JSON', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    const blob = new Blob(['webm-data'], { type: 'video/webm' });

    await storage.saveDraft(draft);
    const media = await storage.saveMedia('draft-1', {
      id: 'trailer',
      kind: 'video',
      name: 'trailer.webm',
    }, blob);

    const savedDraft = await storage.getDraft('draft-1');
    const savedBlob = await storage.getMediaBlob('draft-1', 'trailer');

    expect(media.mimeType).toBe('video/webm');
    expect(media.size).toBe(9);
    expect(savedDraft?.media).toEqual([media]);
    expect(savedBlob).toEqual(blob);
    expect(localStorage.getItem(BUILDER_DRAFTS_STORAGE_KEY)).not.toContain(
      'webm-data',
    );
  });

  test('restores replaced media metadata when blob storage fails', async () => {
    let putCount = 0;
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: {
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

  test('rejects MIME overrides that do not match the blob type', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
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
    ).rejects.toThrow('Provided media MIME type does not match the blob MIME type.');
  });

  test('clears draft metadata and media after publish succeeds', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    await storage.saveDraft(draft);
    await storage.saveMedia('draft-1', {
      id: 'screen-1',
      kind: 'screenshot',
      name: 'screen.png',
    }, new Blob(['image-data'], { type: 'image/png' }));

    await storage.clearPublishedDraft('draft-1');

    expect(await storage.getDraft('draft-1')).toBeNull();
    expect(await storage.getMediaBlob('draft-1', 'screen-1')).toBeNull();
    expect(localStorage.getItem(BUILDER_DRAFTS_STORAGE_KEY)).toBeNull();
  });

  test('removes local draft storage key when the last draft is deleted', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    await storage.saveDraft(draft);
    await storage.deleteDraft('draft-1');

    expect(localStorage.getItem(BUILDER_DRAFTS_STORAGE_KEY)).toBeNull();
  });

  test('does not lose concurrent media saves for the same draft', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
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

  test('keeps draft metadata when deleting media blobs fails', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: {
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

  test('keeps draft metadata when clearing media blobs fails', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: {
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
    expect(localStorage.getItem(BUILDER_DRAFTS_STORAGE_KEY)).toContain(
      'frontier-map',
    );
  });

  test('autosaves pending field changes after the debounce delay', async () => {
    const scheduler = createManualScheduler();
    const statuses: string[] = [];
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
      now: () => new Date('2026-05-18T13:15:00.000Z'),
    });
    await storage.saveDraft(draft);

    const autosave = createBuilderDraftAutosave({
      storage,
      draftId: 'draft-1',
      delayMs: 750,
      setTimeout: scheduler.setTimeout,
      clearTimeout: scheduler.clearTimeout,
      onStatusChange: (status) => statuses.push(status),
    });

    autosave.updateFields({ name: 'Unsaved name' });
    autosave.updateFields({ summary: 'Unsaved summary' });

    expect(scheduler.pendingDelays()).toEqual([750]);
    expect((await storage.getDraft('draft-1'))?.fields).toEqual(draft.fields);

    await scheduler.runNext();

    expect((await storage.getDraft('draft-1'))?.fields).toEqual({
      id: 'frontier-map',
      name: 'Unsaved name',
      summary: 'Unsaved summary',
    });
    expect((await storage.getDraft('draft-1'))?.updatedAt).toBe(
      '2026-05-18T13:15:00.000Z',
    );
    expect(statuses).toEqual(['pending', 'saving', 'saved']);
    expect(autosave.getStatus()).toBe('saved');
  });

  test('autosave flush saves pending fields immediately', async () => {
    const scheduler = createManualScheduler();
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    await storage.saveDraft(draft);
    const autosave = createBuilderDraftAutosave({
      storage,
      draftId: 'draft-1',
      setTimeout: scheduler.setTimeout,
      clearTimeout: scheduler.clearTimeout,
    });

    autosave.updateFields({ name: 'Immediate name' });
    const updatedDraft = await autosave.flush();

    expect(updatedDraft?.fields.name).toBe('Immediate name');
    expect(scheduler.pendingDelays()).toEqual([]);
    expect(autosave.getStatus()).toBe('saved');
  });

  test('autosave keeps pending fields after a delayed save fails', async () => {
    const scheduler = createManualScheduler();
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    await storage.saveDraft(draft);
    let shouldFail = true;
    const autosave = createBuilderDraftAutosave({
      storage: {
        ...storage,
        updateDraftFields: async (draftId, fields) => {
          if (shouldFail) {
            throw new Error('save failed');
          }

          return storage.updateDraftFields(draftId, fields);
        },
      },
      draftId: 'draft-1',
      setTimeout: scheduler.setTimeout,
      clearTimeout: scheduler.clearTimeout,
    });

    autosave.updateFields({ name: 'Retry name' });
    await scheduler.runNext();

    expect(autosave.getStatus()).toBe('error');
    expect(autosave.getError()).toBeInstanceOf(Error);
    expect((await storage.getDraft('draft-1'))?.fields.name).toBe(
      'Frontier Map',
    );

    shouldFail = false;
    const updatedDraft = await autosave.flush();

    expect(updatedDraft?.fields.name).toBe('Retry name');
    expect(autosave.getStatus()).toBe('saved');
  });

  test('autosave persists changes made while a save is in flight', async () => {
    const scheduler = createManualScheduler();
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    await storage.saveDraft(draft);
    const deferredSave = createDeferred<BuilderDraft>();
    let firstSave = true;
    const autosave = createBuilderDraftAutosave({
      storage: {
        ...storage,
        updateDraftFields: async (draftId, fields) => {
          if (firstSave) {
            firstSave = false;
            await deferredSave.promise;
          }

          return storage.updateDraftFields(draftId, fields);
        },
      },
      draftId: 'draft-1',
      setTimeout: scheduler.setTimeout,
      clearTimeout: scheduler.clearTimeout,
    });

    autosave.updateFields({ name: 'First save' });
    const firstFlush = autosave.flush();
    autosave.updateFields({ summary: 'Typed during save' });

    expect(autosave.getStatus()).toBe('pending');

    deferredSave.resolve(draft);
    const updatedDraft = await firstFlush;

    expect(updatedDraft?.fields).toEqual({
      id: 'frontier-map',
      name: 'First save',
      summary: 'Typed during save',
    });
    expect(autosave.getStatus()).toBe('saved');
    expect(scheduler.pendingDelays()).toEqual([]);
  });

  test('autosave cancel drops pending fields and clears scheduled saves', async () => {
    const scheduler = createManualScheduler();
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    await storage.saveDraft(draft);
    const autosave = createBuilderDraftAutosave({
      storage,
      draftId: 'draft-1',
      setTimeout: scheduler.setTimeout,
      clearTimeout: scheduler.clearTimeout,
    });

    autosave.updateFields({ name: 'Canceled name' });
    autosave.cancel();
    await scheduler.runNext();

    expect((await storage.getDraft('draft-1'))?.fields.name).toBe(
      'Frontier Map',
    );
    expect(scheduler.pendingDelays()).toEqual([]);
    expect(autosave.getStatus()).toBe('idle');
  });

  test('autosave keeps pending fields when the draft is missing', async () => {
    const scheduler = createManualScheduler();
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });
    const autosave = createBuilderDraftAutosave({
      storage,
      draftId: 'missing-draft',
      setTimeout: scheduler.setTimeout,
      clearTimeout: scheduler.clearTimeout,
    });

    autosave.updateFields({ name: 'Pending name' });
    await scheduler.runNext();

    expect(autosave.getStatus()).toBe('error');
    expect(autosave.getError()).toBeInstanceOf(Error);
    await storage.saveDraft({
      ...draft,
      id: 'missing-draft',
    });

    const updatedDraft = await autosave.flush();

    expect(updatedDraft?.fields.name).toBe('Pending name');
    expect(autosave.getStatus()).toBe('saved');
  });

  test('supports prototype-like draft IDs safely', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    const protoDraft = {
      ...draft,
      id: '__proto__',
    };
    await storage.saveDraft(protoDraft);

    expect(await storage.getDraft('__proto__')).toEqual(protoDraft);
    expect(await storage.getDraft('toString')).toBeNull();
  });

  test('does not collide media keys when IDs contain colons', async () => {
    const store = createMemoryBuilderDraftMediaStore();
    const firstBlob = new Blob(['first'], { type: 'image/png' });
    const secondBlob = new Blob(['second'], { type: 'image/png' });

    await store.put({ draftId: 'a:b', mediaId: 'c', blob: firstBlob });
    await store.put({ draftId: 'a', mediaId: 'b:c', blob: secondBlob });

    expect(await store.get('a:b', 'c')).toEqual(firstBlob);
    expect(await store.get('a', 'b:c')).toEqual(secondBlob);
  });

  test('keeps only supported MIME types and sizes eligible for draft media', () => {
    expect(
      validateBuilderDraftMediaFile({
        kind: 'video',
        file: new File(['video'], 'trailer.webm', { type: 'video/webm' }),
      }).ok,
    ).toBe(true);

    expect(
      validateBuilderDraftMediaFile({
        kind: 'video',
        file: new File(['video'], 'trailer.mp4', { type: 'video/mp4' }),
      }).ok,
    ).toBe(false);

    expect(
      validateBuilderDraftMediaFile({
        kind: 'video',
        file: blobLike({
          size: MAX_BUILDER_DRAFT_VIDEO_BYTES + 1,
          type: 'video/webm',
        }),
      }).ok,
    ).toBe(false);

    expect(
      validateBuilderDraftMediaFile({
        kind: 'screenshot',
        file: new File(['image'], 'screen.webp', { type: 'image/webp' }),
      }).ok,
    ).toBe(true);

    expect(
      validateBuilderDraftMediaFile({
        kind: 'screenshot',
        file: blobLike({
          size: MAX_BUILDER_DRAFT_SCREENSHOT_BYTES + 1,
          type: 'image/png',
        }),
      }).ok,
    ).toBe(false);
  });
});

function createManualScheduler(): {
  setTimeout: (
    callback: () => void | Promise<void>,
    delayMs: number,
  ) => number;
  clearTimeout: (timerId: number) => void;
  pendingDelays: () => number[];
  runNext: () => Promise<void>;
} {
  const timers = new Map<
    number,
    { callback: () => void | Promise<void>; delayMs: number }
  >();
  let nextTimerId = 1;

  return {
    setTimeout: (callback, delayMs) => {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, { callback, delayMs });
      return timerId;
    },
    clearTimeout: (timerId) => {
      timers.delete(timerId);
    },
    pendingDelays: () =>
      Array.from(timers.values()).map((timer) => timer.delayMs),
    runNext: async () => {
      const [timerId, timer] = timers.entries().next().value ?? [];
      if (!timerId || !timer) return;

      timers.delete(timerId);
      await timer.callback();
    },
  };
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}
