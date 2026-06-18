import { describe, expect, test } from 'bun:test';
import type { DraftMedia } from '@/storage/draftStorage';
import {
  getMediaForSlot,
  getMediaSlotDefinition,
  getMediaSlotStatus,
  getStableMediaIdForSlot,
  MEDIA_SLOT_IDS,
  validateMediaSlots,
} from '../src/builder/mediaSlotModel';

function createMedia(
  overrides: Partial<DraftMedia> & Pick<DraftMedia, 'id' | 'role' | 'kind'>,
): DraftMedia {
  return {
    name: `${overrides.id}.png`,
    mimeType: overrides.kind === 'video' ? 'video/webm' : 'image/png',
    size: 1024,
    createdAt: '2026-05-19T09:00:00.000Z',
    ...overrides,
  };
}

describe('media slot model', () => {
  test('builds gallery slots from a shared template', () => {
    expect(MEDIA_SLOT_IDS).toEqual([
      'logo',
      'thumbnail',
      'gallery-1',
      'gallery-2',
      'gallery-3',
      'video',
    ]);

    const firstGallery = getMediaSlotDefinition('gallery-1');
    const secondGallery = getMediaSlotDefinition('gallery-2');

    expect(firstGallery.label).toBe('Gallery image');
    expect(secondGallery.label).toBe('Gallery image');
    expect(firstGallery.navLabel).toBe('Gallery · 1');
    expect(secondGallery.navLabel).toBe('Gallery · 2');
    expect(firstGallery.guide).toBe(secondGallery.guide);
    expect(firstGallery.required).toBe(true);
    expect(secondGallery.required).toBe(false);
  });

  test('maps stable slot ids to media items', () => {
    const media = [
      createMedia({ id: 'logo', role: 'logo', kind: 'screenshot' }),
      createMedia({ id: 'thumbnail', role: 'thumbnail', kind: 'screenshot' }),
      createMedia({ id: 'gallery-1', role: 'gallery', kind: 'screenshot' }),
    ];

    expect(getStableMediaIdForSlot('logo')).toBe('logo');
    expect(getMediaForSlot(media, 'logo')?.id).toBe('logo');
    expect(getMediaForSlot(media, 'gallery-2')).toBeNull();
  });

  test('requires logo, thumbnail, and one gallery image with alt text', () => {
    expect(
      validateMediaSlots([
        createMedia({
          id: 'logo',
          role: 'logo',
          kind: 'screenshot',
          alt: 'App logo',
        }),
      ]),
    ).toEqual({
      ok: false,
      missingRequiredSlots: ['thumbnail', 'gallery-1'],
      altErrors: {},
    });
  });

  test('reports missing alt text on required slots', () => {
    const result = validateMediaSlots([
      createMedia({ id: 'logo', role: 'logo', kind: 'screenshot' }),
      createMedia({
        id: 'thumbnail',
        role: 'thumbnail',
        kind: 'screenshot',
        alt: 'Card image',
      }),
      createMedia({ id: 'gallery-1', role: 'gallery', kind: 'screenshot' }),
    ]);

    expect(result).toEqual({
      ok: false,
      missingRequiredSlots: [],
      altErrors: {
        logo: 'Alt text is required.',
        'gallery-1': 'Alt text is required.',
      },
    });
  });

  test('accepts a complete required media set', () => {
    const media = [
      createMedia({
        id: 'logo',
        role: 'logo',
        kind: 'screenshot',
        alt: 'Logo',
      }),
      createMedia({
        id: 'thumbnail',
        role: 'thumbnail',
        kind: 'screenshot',
        alt: 'Card',
      }),
      createMedia({
        id: 'gallery-1',
        role: 'gallery',
        kind: 'screenshot',
        alt: 'Gallery',
      }),
    ];

    expect(validateMediaSlots(media)).toEqual({ ok: true });
    expect(getMediaSlotStatus(media, 'gallery-2')).toBe('empty');
  });
});
