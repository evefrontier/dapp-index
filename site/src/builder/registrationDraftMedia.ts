import type { DraftMedia, DraftMediaInput } from '@/storage/draftStorage';
import type { DraftStorage } from '@/storage/draftTypes';
import { validateDraftMediaFile } from '@/storage/draftMediaValidation';
import {
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
} from '@/constants';
import {
  canAddMediaToSlot,
  getMediaForSlot,
  getMediaSlotDefinition,
  getStableMediaIdForSlot,
  validateMediaSlots,
  type MediaSlotId,
} from './mediaSlotModel';
import { MEDIA_STEP_GUIDANCE } from './mediaRoleModel';
import {
  RegistrationDraftMediaItemSchema,
  RegistrationDraftMediaStepSchema,
  RegistrationDraftMediaUploadMimeSchema,
} from '@/schemas/registration-draft-media';
import { zodIssuesToFieldErrors } from '@/schemas/zodFieldErrors';

const MEDIA_ITEM_FIELD_NAMES = ['role', 'alt', 'caption'] as const;

export type RegistrationDraftMediaFieldName =
  (typeof MEDIA_ITEM_FIELD_NAMES)[number];

export type RegistrationDraftMediaFieldErrors = Partial<
  Record<RegistrationDraftMediaFieldName, string>
>;

export type RegistrationDraftMediaErrors = Record<
  string,
  RegistrationDraftMediaFieldErrors
>;

export type RegistrationDraftMediaUploadInputResult =
  | { ok: true; input: DraftMediaInput }
  | { ok: false; errorMessage: string };

export type RegistrationDraftMediaUploadLimitsResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export function validateRegistrationDraftMediaUploadForSlot(
  slotId: MediaSlotId,
  existingMedia: readonly DraftMedia[],
  file: File,
  options: { replacing?: boolean } = {},
): RegistrationDraftMediaUploadLimitsResult {
  const slot = getMediaSlotDefinition(slotId);
  const replacing = options.replacing ?? Boolean(getMediaForSlot(existingMedia, slotId));

  if (!replacing && !canAddMediaToSlot(existingMedia, slotId)) {
    if (slotId === 'video') {
      return {
        ok: false,
        errorMessage: 'Listings support one video.',
      };
    }
    return {
      ok: false,
      errorMessage: `Listings support up to ${MEDIA_STEP_GUIDANCE.itemLimit} media items.`,
    };
  }

  const mimeType = file.type.toLowerCase();
  if (!slot.acceptMime.includes(mimeType)) {
    return {
      ok: false,
      errorMessage:
        slot.kind === 'video'
          ? 'Use a WebM video file.'
          : 'Use PNG, JPEG, or WebP images.',
    };
  }

  const sizeValidation = validateDraftMediaFile({
    kind: slot.kind,
    file,
    mimeType,
  });
  if (!sizeValidation.ok) {
    return { ok: false, errorMessage: sizeValidation.reason };
  }

  const existingTotalSize = existingMedia.reduce(
    (total, media) => total + media.size,
    0,
  );
  const replacedMedia = replacing
    ? getMediaForSlot(existingMedia, slotId)
    : null;
  const adjustedTotal =
    existingTotalSize - (replacedMedia?.size ?? 0) + file.size;
  if (adjustedTotal > PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES) {
    return {
      ok: false,
      errorMessage: `Total media size must stay under ${MEDIA_STEP_GUIDANCE.totalLimit}.`,
    };
  }

  return { ok: true };
}

export function createRegistrationDraftMediaUploadInput(
  file: File,
  slotId: MediaSlotId,
): RegistrationDraftMediaUploadInputResult {
  const slot = getMediaSlotDefinition(slotId);
  const mimeType = file.type.toLowerCase();
  if (!slot.acceptMime.includes(mimeType)) {
    return {
      ok: false,
      errorMessage:
        slot.kind === 'video'
          ? 'Use a WebM video file.'
          : 'Use PNG, JPEG, or WebP images.',
    };
  }

  if (!RegistrationDraftMediaUploadMimeSchema.safeParse(mimeType).success) {
    return {
      ok: false,
      errorMessage: 'Use PNG, JPEG, WebP, or WebM media.',
    };
  }

  const sizeValidation = validateDraftMediaFile({
    kind: slot.kind,
    file,
    mimeType,
  });
  if (!sizeValidation.ok) {
    return {
      ok: false,
      errorMessage: sizeValidation.reason,
    };
  }

  return {
    ok: true,
    input: {
      id: getStableMediaIdForSlot(slotId),
      kind: slot.kind,
      role: slot.role,
      name: file.name,
      mimeType,
    },
  };
}

export async function replaceRegistrationDraftMediaForSlot(
  storage: Pick<DraftStorage, 'saveMedia'>,
  draftId: string,
  slotId: MediaSlotId,
  file: File,
): Promise<void> {
  const uploadInput = createRegistrationDraftMediaUploadInput(file, slotId);
  if (!uploadInput.ok) {
    throw new Error(`${file.name}: ${uploadInput.errorMessage}`);
  }

  await storage.saveMedia(draftId, uploadInput.input, file);
}

export function validateRegistrationDraftMediaStep(
  media: readonly DraftMedia[],
): {
  ok: boolean;
  errors: RegistrationDraftMediaErrors;
} {
  const slotValidation = validateMediaSlots(media);
  const errors: RegistrationDraftMediaErrors = {};

  if (!slotValidation.ok) {
    for (const [mediaId, altError] of Object.entries(
      slotValidation.altErrors,
    )) {
      errors[mediaId] = { alt: altError };
    }
  }

  const parsed = RegistrationDraftMediaStepSchema.safeParse(media);
  if (!parsed.success) {
    const zodErrors = zodMediaStepErrors(parsed.error.issues, media);
    for (const [mediaId, fieldErrors] of Object.entries(zodErrors)) {
      errors[mediaId] = {
        ...errors[mediaId],
        ...fieldErrors,
      };
    }
  }

  if (!slotValidation.ok || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, errors: {} };
}

export function validateRegistrationDraftMediaItem(
  media: DraftMedia,
): RegistrationDraftMediaFieldErrors {
  const parsed = RegistrationDraftMediaItemSchema.safeParse(media);
  if (parsed.success) return {};

  return zodIssuesToFieldErrors(parsed.error.issues, MEDIA_ITEM_FIELD_NAMES);
}

function zodMediaStepErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
  media: readonly DraftMedia[],
): RegistrationDraftMediaErrors {
  const errors: RegistrationDraftMediaErrors = {};

  for (const issue of issues) {
    const mediaIndex = issue.path[0];
    if (typeof mediaIndex !== 'number') continue;

    const mediaItem = media[mediaIndex];
    if (!mediaItem) continue;

    const fieldName = issue.path[1];
    if (
      typeof fieldName !== 'string' ||
      !MEDIA_ITEM_FIELD_NAMES.includes(
        fieldName as RegistrationDraftMediaFieldName,
      )
    ) {
      continue;
    }

    const itemErrors = errors[mediaItem.id] ?? {};
    itemErrors[fieldName as RegistrationDraftMediaFieldName] = issue.message;
    errors[mediaItem.id] = itemErrors;
  }

  return errors;
}
