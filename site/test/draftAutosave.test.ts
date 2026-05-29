import { describe, expect, test } from 'bun:test';
import {
  createDraftAutosave,
  createDraftStorage,
  createMemoryDraftLocalMediaStore,
  createMemoryLocalStorage,
  type Draft,
} from '../src/storage/draftStorage';
import {
  createDeferred,
  createManualScheduler,
  draft,
} from './draftTestUtils';

describe('draft autosave', () => {
  test('autosaves pending field changes after the debounce delay', async () => {
    const scheduler = createManualScheduler();
    const statuses: string[] = [];
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
      now: () => new Date('2026-05-18T13:15:00.000Z'),
    });
    await storage.saveDraft(draft);

    const autosave = createDraftAutosave({
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

  test('flush saves pending fields immediately', async () => {
    const scheduler = createManualScheduler();
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    await storage.saveDraft(draft);
    const autosave = createDraftAutosave({
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

  test('keeps pending fields after a delayed save fails', async () => {
    const scheduler = createManualScheduler();
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    await storage.saveDraft(draft);
    let shouldFail = true;
    const autosave = createDraftAutosave({
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

  test('persists changes made while a save is in flight', async () => {
    const scheduler = createManualScheduler();
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    await storage.saveDraft(draft);
    const deferredSave = createDeferred<Draft>();
    let firstSave = true;
    const autosave = createDraftAutosave({
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

  test('cancel drops pending fields and clears scheduled saves', async () => {
    const scheduler = createManualScheduler();
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    await storage.saveDraft(draft);
    const autosave = createDraftAutosave({
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

  test('keeps pending fields when the draft is missing', async () => {
    const scheduler = createManualScheduler();
    const storage = createDraftStorage({
      localStorage: createMemoryLocalStorage(),
      localMediaStore: createMemoryDraftLocalMediaStore(),
    });
    const autosave = createDraftAutosave({
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
});
