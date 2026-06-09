import { describe, expect, test } from 'bun:test';
import {
  createRegistrationDraftMediaUploadInput,
  createRegistrationMediaId,
  validateRegistrationDraftMediaStep,
} from '../src/builder/registrationDraftMedia';
import { LISTING_MEDIA_IMAGE_MAX_BYTES } from '@/constants';

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
