import { describe, expect, test } from 'bun:test';
import type { DraftMedia } from '@/storage/draftStorage';
import {
  getActiveSlotId,
  getCategoryNavLabel,
  getDefaultGalleryIndex,
  getMediaForSlot,
  getMediaNavGroupStatus,
  getMediaSlotDefinition,
  getMediaSlotNavLabel,
  getMediaSlotStatus,
  MEDIA_CATEGORY_NAV_IDS,
  MEDIA_GALLERY_NAV_SLOT_IDS,
  MEDIA_NAV_GROUPS,
  MEDIA_SLOT_IDS,
  parseMediaSlotNav,
  resolveSlotFromCategory,
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
    expect(firstGallery.navLabel).toBe('Image 1');
    expect(secondGallery.navLabel).toBe('Image 2');
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

  test('defines two-row media nav slot lists', () => {
    expect(MEDIA_CATEGORY_NAV_IDS).toEqual([
      'logo',
      'thumbnail',
      'gallery',
      'video',
    ]);
    expect(MEDIA_GALLERY_NAV_SLOT_IDS).toEqual([
      'gallery-1',
      'gallery-2',
      'gallery-3',
    ]);
    expect(getMediaSlotNavLabel('gallery-2')).toBe('Image 2');
    expect(getCategoryNavLabel('gallery')).toBe('Gallery');
  });

  test('defines horizontal media nav groups', () => {
    expect(MEDIA_NAV_GROUPS.map((group) => group.id)).toEqual([
      'logo',
      'thumbnail',
      'gallery',
      'video',
    ]);
    expect(MEDIA_NAV_GROUPS.find((group) => group.id === 'gallery')?.slotIds).toEqual([
      'gallery-1',
      'gallery-2',
      'gallery-3',
    ]);
  });

  test('resolves active slot ids from nav group selection', () => {
    expect(getActiveSlotId('logo', 0)).toBe('logo');
    expect(getActiveSlotId('gallery', 1)).toBe('gallery-2');
    expect(resolveSlotFromCategory('gallery', 2)).toBe('gallery-3');
    expect(parseMediaSlotNav('gallery-3')).toEqual({
      groupId: 'gallery',
      galleryIndex: 2,
    });
  });

  test('picks the first empty gallery slot by default', () => {
    const media = [
      createMedia({ id: 'gallery-1', role: 'gallery', kind: 'screenshot' }),
    ];

    expect(getDefaultGalleryIndex(media)).toBe(1);
    expect(getDefaultGalleryIndex([])).toBe(0);
  });

  test('aggregates gallery nav group status from slot states', () => {
    expect(getMediaNavGroupStatus([], 'gallery')).toBe('required-missing');
    expect(
      getMediaNavGroupStatus(
        [createMedia({ id: 'gallery-1', role: 'gallery', kind: 'screenshot' })],
        'gallery',
      ),
    ).toBe('filled');
    expect(
      getMediaNavGroupStatus(
        [createMedia({ id: 'logo', role: 'logo', kind: 'screenshot' })],
        'logo',
      ),
    ).toBe('filled');
  });
});
