import { describe, expect, test } from 'bun:test';
import {
  createRegistrationDraftMediaUploadInput,
  replaceRegistrationDraftMediaForSlot,
  validateRegistrationDraftMediaStep,
  validateRegistrationDraftMediaUploadForSlot,
} from '../src/builder/registrationDraftMedia';
import { LISTING_MEDIA_IMAGE_MAX_BYTES } from '@/constants';
import { createTestDraftStorage, draft } from './draftTestUtils';

describe('registration draft media', () => {
  test('creates slot-scoped screenshot media input', () => {
    const result = createRegistrationDraftMediaUploadInput(
      new File(['image'], 'Fleet Ops Screenshot.PNG', { type: 'image/png' }),
      'thumbnail',
    );

    expect(result).toEqual({
      ok: true,
      input: {
        id: 'thumbnail',
        kind: 'screenshot',
        role: 'thumbnail',
        name: 'Fleet Ops Screenshot.PNG',
        mimeType: 'image/png',
      },
    });
  });

  test('preserves existing slot media when replacement save fails', async () => {
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
    const originalMedia = await storage.saveMedia(
      'draft-1',
      {
        id: 'logo',
        kind: 'screenshot',
        role: 'logo',
        name: 'original.png',
        mimeType: 'image/png',
      },
      new Blob(['original'], { type: 'image/png' }),
    );

    await expect(
      replaceRegistrationDraftMediaForSlot(
        storage,
        'draft-1',
        'logo',
        new File(['replacement'], 'replacement.png', { type: 'image/png' }),
        'image/png',
      ),
    ).rejects.toThrow('put failed');

    expect((await storage.getDraft('draft-1'))?.media).toEqual([originalMedia]);
  });

  test('creates slot-scoped video media input from supported WebM files', () => {
    const result = createRegistrationDraftMediaUploadInput(
      new File(['video'], 'Trailer.webm', { type: 'video/webm' }),
      'video',
    );

    expect(result).toEqual({
      ok: true,
      input: {
        id: 'video',
        kind: 'video',
        role: 'demo',
        name: 'Trailer.webm',
        mimeType: 'video/webm',
      },
    });
  });

  test('rejects unsupported file types for a slot', () => {
    expect(
      createRegistrationDraftMediaUploadInput(
        new File(['video'], 'trailer.mp4', { type: 'video/mp4' }),
        'video',
      ),
    ).toEqual({
      ok: false,
      errorMessage: 'Use a WebM video file.',
    });
  });

  test('rejects oversized local media files before storage', () => {
    const oversized = new File(
      [new Uint8Array(LISTING_MEDIA_IMAGE_MAX_BYTES + 1)],
      'huge.png',
      { type: 'image/png' },
    );

    expect(createRegistrationDraftMediaUploadInput(oversized, 'logo')).toEqual({
      ok: false,
      errorMessage: 'Screenshots must be 5 MB or smaller.',
    });
  });

  test('rejects uploads when the listing is full', () => {
    const existingMedia = Array.from({ length: 6 }, (_, index) => ({
      id: `media-${index}`,
      kind: 'screenshot' as const,
      role: 'gallery' as const,
      name: `media-${index}.png`,
      mimeType: 'image/png',
      size: 1024,
      createdAt: '2026-05-19T09:00:00.000Z',
    }));

    expect(
      validateRegistrationDraftMediaUploadForSlot(
        'gallery-1',
        existingMedia,
        new File(['image'], 'extra.png', { type: 'image/png' }),
      ),
    ).toEqual({
      ok: false,
      errorMessage: 'Listings support up to 6 media items.',
    });
  });

  test('validates required slots and alt text for the media wizard step', () => {
    expect(
      validateRegistrationDraftMediaStep([
        {
          id: 'logo',
          kind: 'screenshot',
          role: 'logo',
          name: 'Logo.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
          alt: 'Logo',
        },
      ]),
    ).toMatchObject({
      ok: false,
    });

    expect(
      validateRegistrationDraftMediaStep([
        {
          id: 'logo',
          kind: 'screenshot',
          role: 'logo',
          name: 'Logo.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
          alt: 'a'.repeat(241),
        },
        {
          id: 'thumbnail',
          kind: 'screenshot',
          role: 'thumbnail',
          name: 'Card.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
          alt: 'Card',
        },
        {
          id: 'gallery-1',
          kind: 'screenshot',
          role: 'gallery',
          name: 'Gallery.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
          alt: 'Gallery',
        },
      ]),
    ).toMatchObject({
      ok: false,
      errors: {
        logo: {
          alt: 'Alt text must be 240 characters or fewer.',
        },
      },
    });
  });
});
