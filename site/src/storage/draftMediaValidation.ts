import {
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
} from '@/constants';
import type { DraftMediaKind, DraftMediaValidation } from './draftTypes';

export function validateDraftMediaFile(input: {
  kind: DraftMediaKind;
  file: Blob;
  mimeType?: string;
}): DraftMediaValidation {
  const mimeType = (input.mimeType ?? input.file.type).toLowerCase();

  if (input.kind === 'video') {
    if (mimeType !== 'video/webm') {
      return { ok: false, reason: 'Only video/webm videos are supported.' };
    }

    if (input.file.size > LISTING_MEDIA_VIDEO_MAX_BYTES) {
      return {
        ok: false,
        reason: `Videos must be ${formatBytes(LISTING_MEDIA_VIDEO_MAX_BYTES)} or smaller.`,
      };
    }

    return { ok: true };
  }

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    return {
      ok: false,
      reason: 'Screenshots must be PNG, JPEG, or WebP images.',
    };
  }

  if (input.file.size > LISTING_MEDIA_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      reason: `Screenshots must be ${formatBytes(LISTING_MEDIA_IMAGE_MAX_BYTES)} or smaller.`,
    };
  }

  return { ok: true };
}

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
