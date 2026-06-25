import {
  DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
} from '@/constants';
import type { DraftMediaKind, DraftMediaValidation } from './draftTypes';

export function getDraftMediaFileLimits(kind: DraftMediaKind): {
  acceptMime: readonly string[];
  maxBytes: number;
  sizeLabel: string;
  unsupportedMessage: string;
} {
  if (kind === 'video') {
    return {
      acceptMime: [DAPP_INDEX_VIDEO_MIME_TYPE],
      maxBytes: LISTING_MEDIA_VIDEO_MAX_BYTES,
      sizeLabel: 'Videos',
      unsupportedMessage: 'Only video/webm videos are supported.',
    };
  }

  return {
    acceptMime: DAPP_INDEX_IMAGE_MIME_TYPES,
    maxBytes: LISTING_MEDIA_IMAGE_MAX_BYTES,
    sizeLabel: 'Screenshots',
    unsupportedMessage: 'Screenshots must be PNG, JPEG, or WebP images.',
  };
}

export function validateDraftMediaFile(input: {
  acceptMime: readonly string[];
  maxBytes: number;
  file: Blob;
  mimeType?: string;
  unsupportedMessage?: string;
  sizeLabel?: string;
}): DraftMediaValidation {
  const mimeType = (input.mimeType ?? input.file.type).toLowerCase();
  const unsupportedMessage =
    input.unsupportedMessage ?? 'Unsupported media type.';
  const sizeLabel = input.sizeLabel ?? 'Media';

  if (!input.acceptMime.includes(mimeType)) {
    return { ok: false, reason: unsupportedMessage };
  }

  if (input.file.size > input.maxBytes) {
    return {
      ok: false,
      reason: `${sizeLabel} must be ${formatDecimalMegabytes(input.maxBytes)} or smaller.`,
    };
  }

  return { ok: true };
}

export function validateDraftMediaFileForKind(input: {
  kind: DraftMediaKind;
  file: Blob;
  mimeType?: string;
}): DraftMediaValidation {
  const limits = getDraftMediaFileLimits(input.kind);
  return validateDraftMediaFile({
    ...limits,
    file: input.file,
    mimeType: input.mimeType,
  });
}

/** Formats byte limits as decimal megabytes (matches constants and public docs). */
export function formatDecimalMegabytes(bytes: number): string {
  return `${Math.round(bytes / 1_000_000)} MB`;
}
