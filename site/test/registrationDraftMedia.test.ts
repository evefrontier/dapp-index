import { describe, expect, test } from 'bun:test';
import {
  createRegistrationDraftMediaUploadInput,
  createRegistrationMediaId,
} from '../src/builder/registrationDraftMedia';

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
        role: 'gallery',
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
});
