import { describe, expect, test } from 'bun:test';
import {
  createRegistrationDraftMediaUploadInput,
  createRegistrationMediaId,
  validateRegistrationDraftMediaStep,
  validateRegistrationDraftMediaUploadLimits,
} from '../src/builder/registrationDraftMedia';
import {
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  PUBLIC_MEDIA_ITEM_LIMIT,
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
  PUBLIC_MEDIA_VIDEO_LIMIT,
} from '@/constants';

describe('registration draft media', () => {
  test('creates local screenshot media input from supported image files', () => {
    const result = createRegistrationDraftMediaUploadInput(
      new File(['image'], 'Fleet Ops Screenshot.PNG', { type: 'image/png' }),
      [],
    );

    expect(result).toEqual({
      ok: true,
      input: {
        id: 'fleet-ops-screenshot',
        kind: 'screenshot',
        role: 'gallery',
        name: 'Fleet Ops Screenshot.PNG',
        mimeType: 'image/png',
      },
    });
  });

  test('creates unique schema-safe media ids', () => {
    expect(
      createRegistrationMediaId('Fleet Ops Screenshot.PNG', [
        'fleet-ops-screenshot',
        'fleet-ops-screenshot-2',
      ]),
    ).toBe('fleet-ops-screenshot-3');
    expect(createRegistrationMediaId('---.png', [])).toBe('media');
  });

  test('creates local video media input from supported WebM files', () => {
    const result = createRegistrationDraftMediaUploadInput(
      new File(['video'], 'Trailer.webm', { type: 'video/webm' }),
      [],
    );

    expect(result).toEqual({
      ok: true,
      input: {
        id: 'trailer',
        kind: 'video',
        role: 'demo',
        name: 'Trailer.webm',
        mimeType: 'video/webm',
      },
    });
  });

  test('rejects unsupported local media file types before storage', () => {
    expect(
      createRegistrationDraftMediaUploadInput(
        new File(['video'], 'trailer.mp4', { type: 'video/mp4' }),
        [],
      ),
    ).toEqual({
      ok: false,
      errorMessage: 'Use PNG, JPEG, WebP, or WebM media.',
    });
  });

  test('rejects oversized local media files before storage', () => {
    const oversized = new File(
      [new Uint8Array(LISTING_MEDIA_IMAGE_MAX_BYTES + 1)],
      'huge.png',
      { type: 'image/png' },
    );

    expect(createRegistrationDraftMediaUploadInput(oversized, [])).toEqual({
      ok: false,
      errorMessage: 'Screenshots must be 5 MB or smaller.',
    });
  });

  test('rejects uploads that exceed published media item limits', () => {
    const existingMedia = Array.from({ length: PUBLIC_MEDIA_ITEM_LIMIT }, (_, index) => ({
      id: `media-${index}`,
      kind: 'screenshot' as const,
      role: 'gallery' as const,
      name: `media-${index}.png`,
      mimeType: 'image/png',
      size: 1024,
      createdAt: '2026-05-19T09:00:00.000Z',
    }));

    expect(
      validateRegistrationDraftMediaUploadLimits(existingMedia, [
        new File(['image'], 'extra.png', { type: 'image/png' }),
      ]),
    ).toEqual({
      ok: false,
      errorMessage: `Listings support up to ${PUBLIC_MEDIA_ITEM_LIMIT} media items.`,
    });
  });

  test('rejects uploads that exceed published video count limits', () => {
    const existingMedia = Array.from({ length: PUBLIC_MEDIA_VIDEO_LIMIT }, (_, index) => ({
      id: `video-${index}`,
      kind: 'video' as const,
      role: 'demo' as const,
      name: `video-${index}.webm`,
      mimeType: 'video/webm',
      size: 1024,
      createdAt: '2026-05-19T09:00:00.000Z',
    }));

    expect(
      validateRegistrationDraftMediaUploadLimits(existingMedia, [
        new File(['video'], 'extra.webm', { type: 'video/webm' }),
      ]),
    ).toEqual({
      ok: false,
      errorMessage: `Listings support up to ${PUBLIC_MEDIA_VIDEO_LIMIT} videos.`,
    });
  });

  test('rejects uploads that exceed published total media size limits', () => {
    const existingMedia = [
      {
        id: 'large-image',
        kind: 'screenshot' as const,
        role: 'gallery' as const,
        name: 'large.png',
        mimeType: 'image/png',
        size: PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES - 1024,
        createdAt: '2026-05-19T09:00:00.000Z',
      },
    ];

    expect(
      validateRegistrationDraftMediaUploadLimits(existingMedia, [
        new File([new Uint8Array(2048)], 'extra.png', { type: 'image/png' }),
      ]),
    ).toEqual({
      ok: false,
      errorMessage: 'Total media size must stay under 143 MB.',
    });
  });

  test('validates media metadata for the media wizard step', () => {
    expect(
      validateRegistrationDraftMediaStep([
        {
          id: 'hero-shot',
          kind: 'screenshot',
          role: 'gallery',
          name: 'Hero.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
          alt: 'a'.repeat(241),
        },
      ]),
    ).toMatchObject({
      ok: false,
      errors: {
        'hero-shot': {
          alt: 'Alt text must be 240 characters or fewer.',
        },
      },
    });
  });
});
