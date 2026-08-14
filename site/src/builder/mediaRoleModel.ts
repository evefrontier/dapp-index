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

/** Total wallet approvals for a publish run (media blobs + metadata + registry). */
export function getPublishWalletApprovalCount(mediaItemCount: number): number {
  return mediaItemCount * 2 + 2 + 1;
}

/** Pre-publish wallet approval estimate copy for the media step footer. */
export function getMediaPublishApprovalEstimateCopy(
  mediaItemCount: number,
): string {
  const total = getPublishWalletApprovalCount(mediaItemCount);
  return `Publishing needs up to ${total} wallet approvals (${mediaItemCount} files × 2 + metadata + registry).`;
}

/** Pre-flight guidance for the publish step screen. */
export function getPublishStepGuidanceCopy(
  mediaItemCount: number,
): readonly string[] {
  const approvalCount = getPublishWalletApprovalCount(mediaItemCount);
  const fileLabel =
    mediaItemCount === 1 ? '1 file' : `${mediaItemCount} files`;

  return [
    'Publish stores your media on Walrus, uploads a metadata JSON blob, then writes or updates your listing on Sui. Each media file needs two wallet approvals (register storage, then certify). Metadata and the registry listing add three more.',
    `This draft needs up to ${approvalCount} wallet approvals (${fileLabel} × 2 + metadata + registry). SUI covers gas and registry fees; WAL pays for Walrus storage (see balances above).`,
    'After a successful publish, your listing becomes discoverable in the directory. This local draft stays as a read-only record.',
  ];
}
