import { describe, expect, test } from 'bun:test';
import {
  BUILDER_DRAFTS_STORAGE_KEY,
  MAX_BUILDER_DRAFT_SCREENSHOT_BYTES,
  MAX_BUILDER_DRAFT_VIDEO_BYTES,
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
