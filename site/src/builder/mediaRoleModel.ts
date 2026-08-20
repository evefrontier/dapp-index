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
import type { MediaSlotDefinition } from './mediaSlotModel';

let mediaRoleLabelsCache: Partial<Record<DappIndexMediaRole, string>> | null =
  null;

function getMediaRoleLabels(): Partial<Record<DappIndexMediaRole, string>> {
  if (mediaRoleLabelsCache) return mediaRoleLabelsCache;

  const labels: Partial<Record<DappIndexMediaRole, string>> = {
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

/** Guidance for the media step guide dialog. */
export type MediaGuideSection = {
  title: string;
  bullets: readonly string[];
};

export function getMediaSlotFormatBullets(
  slot: MediaSlotDefinition,
): readonly string[] {
  const imageFormats = `PNG, JPEG, or WebP up to ${MEDIA_STEP_GUIDANCE.imageLimit}`;

  switch (slot.id) {
    case 'logo':
      return [
        'Square image, about 256px or larger',
        'PNG or WebP with a transparent background works well',
        imageFormats,
      ];
    case 'thumbnail':
      return [
        'Wide landscape screenshot for catalog cards',
        'About 1280px wide',
        imageFormats,
      ];
    case 'video':
      return [
        'Optional WebM walkthrough for the detail carousel',
        'Landscape orientation, up to about one minute',
        `WebM up to ${MEDIA_STEP_GUIDANCE.videoLimit}`,
      ];
    default:
      return [
        slot.guide,
        imageFormats,
        ...(slot.required ? ['Alt text is required before publish'] : []),
      ];
  }
}

export function getMediaStepGuideSections(
  mediaItemCount: number,
): {
  intro: string;
  sections: readonly MediaGuideSection[];
  footer: string;
} {
  const { galleryLimit, imageLimit, itemLimit, totalLimit, videoLimit } =
    MEDIA_STEP_GUIDANCE;

  const slotSections = MEDIA_SLOT_DEFINITIONS.filter(
    (slot) => slot.id === 'logo' || slot.id === 'thumbnail' || slot.id === 'video',
  ).map((slot) => ({
    title: slot.label,
    bullets: getMediaSlotFormatBullets(slot),
  }));

  return {
    intro:
      'Logo, thumbnail, and at least one gallery image are required before publish. Gallery images and an optional demo video appear on the detail page.',
    sections: [
      ...slotSections,
      {
        title: 'Gallery images',
        bullets: [
          'Wide landscape screenshots for the detail carousel',
          'About 1280px wide',
          `PNG, JPEG, or WebP up to ${imageLimit} each`,
          `Up to ${galleryLimit} gallery images; alt text required on the first`,
        ],
      },
      {
        title: 'Overall limits',
        bullets: [
          `${itemLimit} media items total across all slots`,
          `${totalLimit} combined size across images, posters, and video`,
          `Video: WebM up to ${videoLimit}`,
          getMediaPublishApprovalEstimateCopy(mediaItemCount),
        ],
      },
    ],
    footer:
      'Media stays on this device until publish. Each file is uploaded to storage during publish.',
  };
}

/** @deprecated Use getMediaStepGuideSections for structured guide content. */
export function getMediaStepGuideCopy(
  mediaItemCount: number,
): readonly string[] {
  const { intro, sections, footer } = getMediaStepGuideSections(mediaItemCount);

  return [
    intro,
    sections
      .flatMap((section) => section.bullets)
      .slice(0, 2)
      .join(' '),
    footer,
  ];
}
