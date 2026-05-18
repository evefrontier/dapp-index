import { describe, expect, test } from 'bun:test';
import {
  createBuilderDraftStorage,
  createMemoryBuilderDraftMediaStore,
  createMemoryLocalStorage,
  validateBuilderDraftMediaFile,
  type BuilderDraft,
} from '../src/builder/draftStorage';

const draft: BuilderDraft = {
  id: 'draft-1',
  status: 'draft',
  createdAt: '2026-05-18T12:00:00.000Z',
  updatedAt: '2026-05-18T12:00:00.000Z',
  fields: {
    id: 'frontier-map',
    name: 'Frontier Map',
  },
  media: [],
};

describe('builder draft storage', () => {
  test('stores draft fields in local storage', async () => {
    const localStorage = createMemoryLocalStorage();
    const storage = createBuilderDraftStorage({
      localStorage,
      mediaStore: createMemoryBuilderDraftMediaStore(),
    });

    await storage.saveDraft(draft);

    expect(await storage.getDraft('draft-1')).toEqual(draft);
    expect(localStorage.getItem('dapp-index:builder-drafts:v1')).toContain(
      'frontier-map',
    );
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
    expect(localStorage.getItem('dapp-index:builder-drafts:v1')).not.toContain(
      'webm-data',
    );
  });

  test('clears draft metadata and media after publish succeeds', async () => {
    const storage = createBuilderDraftStorage({
      localStorage: createMemoryLocalStorage(),
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
  });

  test('keeps only webm videos eligible for draft media', () => {
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
        kind: 'screenshot',
        file: new File(['image'], 'screen.webp', { type: 'image/webp' }),
      }).ok,
    ).toBe(true);
  });
});
