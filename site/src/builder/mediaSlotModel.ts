import type { DraftMedia, DraftMediaKind } from '@/storage/draftStorage';
import {
  DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
  PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT,
  PUBLIC_MEDIA_ITEM_LIMIT,
} from '@/constants';
import type { DappIndexMediaRole } from '@/types/dapp-index';

/** Slots with a fixed id that is not gallery-indexed. */
export type FixedMediaSlotId = 'logo' | 'thumbnail' | 'video';

/** Stable gallery slot ids: `gallery-1` … `gallery-N`. */
export type GalleryMediaSlotId = `gallery-${number}`;

export type MediaSlotId = FixedMediaSlotId | GalleryMediaSlotId;

export type MediaSlotDefinition = {
  id: MediaSlotId;
  label: string;
  /** Shown in slot nav when multiple slots share the same label (gallery). */
  navLabel: string;
  purpose: string;
  guide: string;
  role: DappIndexMediaRole;
  kind: DraftMediaKind;
  required: boolean;
  acceptMime: readonly string[];
  maxBytes: number;
};

export type MediaSlotStatus = 'empty' | 'filled' | 'required-missing';

export type MediaNavGroupId = 'logo' | 'thumbnail' | 'gallery' | 'video';

export type MediaNavGroup = {
  id: MediaNavGroupId;
  label: string;
  slotIds: readonly MediaSlotId[];
};

export type MediaSlotValidationResult =
  | { ok: true }
  | {
      ok: false;
      missingRequiredSlots: MediaSlotId[];
      altErrors: Record<string, string>;
    };

const GALLERY_SLOT_GUIDE =
  'Wide landscape screenshot for the detail carousel. About 1280px wide.';

const IMAGE_SLOT_DEFAULTS = {
  kind: 'screenshot' as const,
  acceptMime: DAPP_INDEX_IMAGE_MIME_TYPES,
  maxBytes: LISTING_MEDIA_IMAGE_MAX_BYTES,
};

function gallerySlotId(index: number): GalleryMediaSlotId {
  return `gallery-${index + 1}`;
}

function createGallerySlotDefinition(index: number): MediaSlotDefinition {
  const id = gallerySlotId(index);
  const position = index + 1;
  const required = index === 0;

  return {
    id,
    label: 'Gallery image',
    navLabel: `Image ${position}`,
    purpose: required
      ? 'At least one screenshot for the detail page carousel.'
      : 'Optional additional carousel screenshot.',
    guide: GALLERY_SLOT_GUIDE,
    role: 'gallery',
    required,
    ...IMAGE_SLOT_DEFAULTS,
  };
}

function buildMediaSlotDefinitions(): MediaSlotDefinition[] {
  const gallerySlots = Array.from(
    { length: PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT },
    (_, index) => createGallerySlotDefinition(index),
  );

  return [
    {
      id: 'logo',
      label: 'Logo',
      navLabel: 'Logo',
      purpose: 'Shown as the app icon on cards and detail pages.',
      guide:
        'Square image, about 256px or larger. PNG or WebP with a transparent background works well.',
      role: 'logo',
      required: true,
      ...IMAGE_SLOT_DEFAULTS,
    },
    {
      id: 'thumbnail',
      label: 'Thumbnail',
      navLabel: 'Thumbnail',
      purpose: 'Shown on catalog cards.',
      guide: 'Wide landscape screenshot for catalog cards. About 1280px wide.',
      role: 'thumbnail',
      required: true,
      ...IMAGE_SLOT_DEFAULTS,
    },
    ...gallerySlots,
    {
      id: 'video',
      label: 'Video',
      navLabel: 'Video',
      purpose: 'Optional WebM walkthrough in the detail carousel.',
      guide: 'WebM walkthrough, landscape, up to about one minute.',
      role: 'demo',
      kind: 'video',
      required: false,
      acceptMime: [DAPP_INDEX_VIDEO_MIME_TYPE],
      maxBytes: LISTING_MEDIA_VIDEO_MAX_BYTES,
    },
  ];
}

export const MEDIA_SLOT_DEFINITIONS: readonly MediaSlotDefinition[] =
  buildMediaSlotDefinitions();

export const MEDIA_SLOT_IDS: readonly MediaSlotId[] = MEDIA_SLOT_DEFINITIONS.map(
  (slot) => slot.id,
);

const GALLERY_SLOT_IDS = MEDIA_SLOT_DEFINITIONS.filter(
  (slot) => slot.role === 'gallery',
).map((slot) => slot.id);

export const MEDIA_CATEGORY_NAV_IDS = [
  'logo',
  'thumbnail',
  'gallery',
  'video',
] as const satisfies readonly MediaNavGroupId[];

export type MediaCategoryNavId = (typeof MEDIA_CATEGORY_NAV_IDS)[number];

/** @deprecated Use MEDIA_CATEGORY_NAV_IDS for the top filter row. */
export const MEDIA_PRIMARY_NAV_SLOT_IDS = [
  'logo',
  'thumbnail',
  'video',
] as const satisfies readonly MediaSlotId[];

export type MediaPrimaryNavSlotId = (typeof MEDIA_PRIMARY_NAV_SLOT_IDS)[number];

export const MEDIA_GALLERY_NAV_SLOT_IDS = GALLERY_SLOT_IDS;

export const MEDIA_NAV_GROUPS: readonly MediaNavGroup[] = [
  { id: 'logo', label: 'Logo', slotIds: ['logo'] },
  { id: 'thumbnail', label: 'Thumbnail', slotIds: ['thumbnail'] },
  { id: 'gallery', label: 'Gallery', slotIds: GALLERY_SLOT_IDS },
  { id: 'video', label: 'Video', slotIds: ['video'] },
];

export function getMediaSlotNavLabel(slotId: MediaSlotId): string {
  return getMediaSlotDefinition(slotId).navLabel;
}

export function getCategoryNavLabel(categoryId: MediaCategoryNavId): string {
  if (categoryId === 'gallery') return 'Gallery';
  return getMediaSlotNavLabel(categoryId);
}

export function getCategoryNavStatus(
  media: readonly DraftMedia[],
  categoryId: MediaCategoryNavId,
): MediaSlotStatus {
  if (categoryId === 'gallery') {
    return getMediaNavGroupStatus(media, 'gallery');
  }
  return getMediaSlotStatus(media, categoryId);
}

export function resolveSlotFromCategory(
  categoryId: MediaCategoryNavId,
  galleryIndex: number,
): MediaSlotId {
  return getActiveSlotId(categoryId, galleryIndex);
}

export function isGalleryNavSlot(slotId: MediaSlotId): boolean {
  return slotId.startsWith('gallery-');
}

const MEDIA_SLOT_BY_ID = new Map<MediaSlotId, MediaSlotDefinition>(
  MEDIA_SLOT_DEFINITIONS.map((slot) => [slot.id, slot]),
);

export function getMediaSlotDefinition(slotId: MediaSlotId): MediaSlotDefinition {
  const slot = MEDIA_SLOT_BY_ID.get(slotId);
  if (!slot) {
    throw new Error(`Unknown media slot: ${slotId}`);
  }
  return slot;
}

export function getAcceptAttributeForSlot(slotId: MediaSlotId): string {
  return getMediaSlotDefinition(slotId).acceptMime.join(',');
}

/** Matches draft media by stable slot id only (`logo`, `gallery-1`, …). */
export function getMediaForSlot(
  media: readonly DraftMedia[],
  slotId: MediaSlotId,
): DraftMedia | null {
  return media.find((item) => item.id === slotId) ?? null;
}

export function getMediaSlotStatus(
  media: readonly DraftMedia[],
  slotId: MediaSlotId,
): MediaSlotStatus {
  const slot = getMediaSlotDefinition(slotId);
  const item = getMediaForSlot(media, slotId);
  if (item) return 'filled';
  return slot.required ? 'required-missing' : 'empty';
}

export function validateMediaSlots(
  media: readonly DraftMedia[],
): MediaSlotValidationResult {
  const missingRequiredSlots = MEDIA_SLOT_DEFINITIONS.filter(
    (slot) => slot.required && !getMediaForSlot(media, slot.id),
  ).map((slot) => slot.id);

  const altErrors: Record<string, string> = {};
  for (const slot of MEDIA_SLOT_DEFINITIONS) {
    if (!slot.required) continue;

    const item = getMediaForSlot(media, slot.id);
    if (!item) continue;

    if (!item.alt?.trim()) {
      altErrors[item.id] = 'Alt text is required.';
    }
  }

  if (missingRequiredSlots.length === 0 && Object.keys(altErrors).length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    missingRequiredSlots,
    altErrors,
  };
}

export function canAddMediaToSlot(
  media: readonly DraftMedia[],
  slotId: MediaSlotId,
): boolean {
  if (getMediaForSlot(media, slotId)) return true;
  return media.length < PUBLIC_MEDIA_ITEM_LIMIT;
}

export function getActiveSlotId(
  groupId: MediaNavGroupId,
  galleryIndex: number,
): MediaSlotId {
  if (groupId === 'gallery') {
    return gallerySlotId(galleryIndex);
  }
  return groupId;
}

export function getDefaultGalleryIndex(media: readonly DraftMedia[]): number {
  for (let index = 0; index < GALLERY_SLOT_IDS.length; index += 1) {
    const slotId = gallerySlotId(index);
    if (!getMediaForSlot(media, slotId)) return index;
  }
  return 0;
}

export function getMediaNavGroup(
  groupId: MediaNavGroupId,
): MediaNavGroup {
  const group = MEDIA_NAV_GROUPS.find((entry) => entry.id === groupId);
  if (!group) {
    throw new Error(`Unknown media nav group: ${groupId}`);
  }
  return group;
}

export function getMediaNavGroupStatus(
  media: readonly DraftMedia[],
  groupId: MediaNavGroupId,
): MediaSlotStatus {
  const group = getMediaNavGroup(groupId);
  let hasRequiredMissing = false;
  let hasFilled = false;

  for (const slotId of group.slotIds) {
    const status = getMediaSlotStatus(media, slotId);
    if (status === 'required-missing') {
      hasRequiredMissing = true;
    }
    if (status === 'filled') {
      hasFilled = true;
    }
  }

  if (hasRequiredMissing) return 'required-missing';
  if (hasFilled) return 'filled';
  return 'empty';
}

export function parseMediaSlotNav(
  slotId: MediaSlotId,
): { groupId: MediaNavGroupId; galleryIndex: number } {
  if (slotId.startsWith('gallery-')) {
    const position = Number(slotId.slice('gallery-'.length));
    return {
      groupId: 'gallery',
      galleryIndex: Number.isFinite(position) ? position - 1 : 0,
    };
  }

  if (slotId === 'logo' || slotId === 'thumbnail' || slotId === 'video') {
    return { groupId: slotId, galleryIndex: 0 };
  }

  throw new Error(`Unknown media slot for nav: ${slotId}`);
}
