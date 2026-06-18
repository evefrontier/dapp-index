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
  validateMediaSlots,
  type MediaSlotDefinition,
  type MediaSlotId,
} from './mediaSlotModel';
import { MEDIA_STEP_GUIDANCE } from './mediaRoleModel';
import {
  RegistrationDraftMediaItemSchema,
  RegistrationDraftMediaStepSchema,
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
  | { ok: true; mimeType: string }
  | { ok: false; errorMessage: string };

type SlotMediaFileValidation =
  | { ok: true; mimeType: string }
  | { ok: false; errorMessage: string };

function validateSlotMediaFile(
  slot: MediaSlotDefinition,
  file: File,
): SlotMediaFileValidation {
  const mimeType = file.type.toLowerCase();
  const validation = validateDraftMediaFile({
    acceptMime: slot.acceptMime,
    maxBytes: slot.maxBytes,
    file,
    mimeType,
    unsupportedMessage:
      slot.kind === 'video'
        ? 'Use a WebM video file.'
        : 'Use PNG, JPEG, or WebP images.',
    sizeLabel: slot.kind === 'video' ? 'Videos' : 'Screenshots',
  });
  if (!validation.ok) {
    return { ok: false, errorMessage: validation.reason };
  }

  return { ok: true, mimeType };
}

export function buildRegistrationDraftMediaUploadInput(
  slotId: MediaSlotId,
  file: File,
  mimeType: string,
): DraftMediaInput {
  const slot = getMediaSlotDefinition(slotId);
  return {
    id: slotId,
    kind: slot.kind,
    role: slot.role,
    name: file.name,
    mimeType,
  };
}

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

  const fileValidation = validateSlotMediaFile(slot, file);
  if (!fileValidation.ok) {
    return { ok: false, errorMessage: fileValidation.errorMessage };
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

  return { ok: true, mimeType: fileValidation.mimeType };
}

export function createRegistrationDraftMediaUploadInput(
  file: File,
  slotId: MediaSlotId,
): RegistrationDraftMediaUploadInputResult {
  const slot = getMediaSlotDefinition(slotId);
  const fileValidation = validateSlotMediaFile(slot, file);
  if (!fileValidation.ok) {
    return { ok: false, errorMessage: fileValidation.errorMessage };
  }

  return {
    ok: true,
    input: buildRegistrationDraftMediaUploadInput(
      slotId,
      file,
      fileValidation.mimeType,
    ),
  };
}

export async function replaceRegistrationDraftMediaForSlot(
  storage: Pick<DraftStorage, 'saveMedia'>,
  draftId: string,
  slotId: MediaSlotId,
  file: File,
  mimeType: string,
): Promise<void> {
  await storage.saveMedia(
    draftId,
    buildRegistrationDraftMediaUploadInput(slotId, file, mimeType),
    file,
  );
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
