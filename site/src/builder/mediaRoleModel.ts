import type { DraftMediaKind } from '@/storage/draftStorage';
import {
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
  PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT,
  PUBLIC_MEDIA_ITEM_LIMIT,
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
  PUBLIC_MEDIA_VIDEO_LIMIT,
} from '@/constants';
import type { DappIndexMediaRole } from '@/types/dapp-index';
import { MEDIA_SLOT_DEFINITIONS } from './mediaSlotModel';

export function getDefaultMediaRoleForKind(
  kind: DraftMediaKind,
): DappIndexMediaRole {
  return kind === 'video' ? 'demo' : 'gallery';
}

let mediaRoleLabelsCache: Partial<Record<DappIndexMediaRole, string>> | null =
  null;

function getMediaRoleLabels(): Partial<Record<DappIndexMediaRole, string>> {
  if (mediaRoleLabelsCache) return mediaRoleLabelsCache;

  const labels: Partial<Record<DappIndexMediaRole, string>> = {
    hero: 'Hero',
    gallery: 'Gallery',
  };

  for (const slot of MEDIA_SLOT_DEFINITIONS) {
    if (slot.role === 'gallery') continue;
    labels[slot.role] = slot.label;
  }

  mediaRoleLabelsCache = labels;
  return labels;
}

export function getMediaRoleLabel(role: DappIndexMediaRole): string {
  return getMediaRoleLabels()[role] ?? role;
}

function formatMediaByteLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Copy and limits for the builder media step (aligned with published metadata). */
export const MEDIA_STEP_GUIDANCE = {
  imageLimit: formatMediaByteLimit(LISTING_MEDIA_IMAGE_MAX_BYTES),
  videoLimit: formatMediaByteLimit(LISTING_MEDIA_VIDEO_MAX_BYTES),
  totalLimit: formatMediaByteLimit(PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES),
  itemLimit: PUBLIC_MEDIA_ITEM_LIMIT,
  galleryLimit: PUBLIC_MEDIA_GALLERY_IMAGE_LIMIT,
  videoLimitCount: PUBLIC_MEDIA_VIDEO_LIMIT,
} as const;

/** Pre-publish wallet approval estimate copy for the media step footer. */
export function getMediaPublishApprovalEstimateCopy(
  mediaItemCount: number,
): string {
  const blobSteps = mediaItemCount * 2;
  const total = blobSteps + 2 + 1;
  return `Publishing needs up to ${total} wallet approvals (${mediaItemCount} files × 2 + metadata + registry).`;
}
