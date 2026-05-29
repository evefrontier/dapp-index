import {
  MAX_DRAFT_SCREENSHOT_BYTES,
  MAX_DRAFT_VIDEO_BYTES,
  type DraftMediaKind,
  type DraftMediaValidation,
} from './draftTypes';

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

    if (input.file.size > MAX_DRAFT_VIDEO_BYTES) {
      return {
        ok: false,
        reason: `Videos must be ${formatBytes(MAX_DRAFT_VIDEO_BYTES)} or smaller.`,
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

  if (input.file.size > MAX_DRAFT_SCREENSHOT_BYTES) {
    return {
      ok: false,
      reason: `Screenshots must be ${formatBytes(MAX_DRAFT_SCREENSHOT_BYTES)} or smaller.`,
    };
  }

  return { ok: true };
}

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
