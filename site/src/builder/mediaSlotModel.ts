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

function parseGallerySlotIndex(slotId: MediaSlotId): number | null {
  if (!slotId.startsWith('gallery-')) return null;
  const index = Number(slotId.slice('gallery-'.length));
  if (
    !Number.isInteger(index) ||
    index < 1 ||
    index > PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT
  ) {
    return null;
  }
  return index - 1;
}

function createGallerySlotDefinition(index: number): MediaSlotDefinition {
  const id = gallerySlotId(index);
  const position = index + 1;
  const required = index === 0;

  return {
    id,
    label: 'Gallery image',
    navLabel: `Gallery · ${position}`,
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

const MEDIA_SLOT_BY_ID = new Map<MediaSlotId, MediaSlotDefinition>(
  MEDIA_SLOT_DEFINITIONS.map((slot) => [slot.id, slot]),
);

export function isGalleryMediaSlot(slotId: MediaSlotId): slotId is GalleryMediaSlotId {
  return parseGallerySlotIndex(slotId) !== null;
}

export function getMediaSlotDefinition(slotId: MediaSlotId): MediaSlotDefinition {
  const slot = MEDIA_SLOT_BY_ID.get(slotId);
  if (!slot) {
    throw new Error(`Unknown media slot: ${slotId}`);
  }
  return slot;
}

/** Stable draft/publish media id for a slot (currently identical to slot id). */
export function getStableMediaIdForSlot(slotId: MediaSlotId): string {
  return slotId;
}

export function getAcceptAttributeForSlot(slotId: MediaSlotId): string {
  return getMediaSlotDefinition(slotId).acceptMime.join(',');
}

export function getMediaForSlot(
  media: readonly DraftMedia[],
  slotId: MediaSlotId,
): DraftMedia | null {
  const stableId = getStableMediaIdForSlot(slotId);
  const byStableId = media.find((item) => item.id === stableId);
  if (byStableId) return byStableId;

  if (isGalleryMediaSlot(slotId)) {
    return null;
  }

  const slot = getMediaSlotDefinition(slotId);
  if (slot.kind === 'video') {
    return media.find((item) => item.kind === 'video') ?? null;
  }

  return (
    media.find(
      (item) => item.role === slot.role && item.kind === slot.kind,
    ) ?? null
  );
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

export function estimatePublishBlobCount(media: readonly DraftMedia[]): number {
  return media.length;
}

export function canAddMediaToSlot(
  media: readonly DraftMedia[],
  slotId: MediaSlotId,
): boolean {
  if (getMediaForSlot(media, slotId)) return true;
  if (media.length >= PUBLIC_MEDIA_ITEM_LIMIT) return false;
  if (getMediaSlotDefinition(slotId).kind === 'video') {
    return !media.some((item) => item.kind === 'video');
  }
  return true;
}
