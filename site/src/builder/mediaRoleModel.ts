import {
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
  PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT,
  PUBLIC_MEDIA_ITEM_LIMIT,
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
} from '@/constants';
import { formatDecimalMegabytes } from '@/storage/draftMediaValidation';
import type { DappIndexMediaRole } from '@/types/dapp-index';
import { MEDIA_SLOT_DEFINITIONS } from './mediaSlotModel';

const MEDIA_ROLE_LABELS: Partial<Record<DappIndexMediaRole, string>> = {
  hero: 'Hero',
  gallery: 'Gallery',
  ...Object.fromEntries(
    MEDIA_SLOT_DEFINITIONS.filter((slot) => slot.role !== 'gallery').map(
      (slot) => [slot.role, slot.label],
    ),
  ),
};

export function getMediaRoleLabel(role: DappIndexMediaRole): string {
  return MEDIA_ROLE_LABELS[role] ?? role;
}

/** Copy and limits for the builder media step (aligned with published metadata). */
export const MEDIA_STEP_GUIDANCE = {
  imageLimit: formatDecimalMegabytes(LISTING_MEDIA_IMAGE_MAX_BYTES),
  videoLimit: formatDecimalMegabytes(LISTING_MEDIA_VIDEO_MAX_BYTES),
  totalLimit: formatDecimalMegabytes(PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES),
  itemLimit: PUBLIC_MEDIA_ITEM_LIMIT,
  galleryLimit: PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT,
} as const;

/** Pre-publish wallet approval estimate copy for the media step footer. */
export function getMediaPublishApprovalEstimateCopy(
  mediaItemCount: number,
): string {
  const blobSteps = mediaItemCount * 2;
  const total = blobSteps + 2 + 1;
  return `Publishing needs up to ${total} wallet approvals (${mediaItemCount} files × 2 + metadata + registry).`;
}
