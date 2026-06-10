import type { DraftMedia, DraftMediaInput } from '@/storage/draftStorage';
import { validateDraftMediaFile } from '@/storage/draftMediaValidation';
import {
  DAPP_INDEX_VIDEO_MIME_TYPE,
  PUBLIC_MEDIA_ITEM_LIMIT,
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
  PUBLIC_MEDIA_VIDEO_LIMIT,
} from '@/constants';
import { getDefaultMediaRoleForKind, MEDIA_STEP_GUIDANCE } from './mediaRoleModel';
import {
  RegistrationDraftMediaItemSchema,
  RegistrationDraftMediaStepSchema,
  RegistrationDraftMediaUploadMimeSchema,
} from '@/schemas/registration-draft-media';
import { zodIssuesToFieldErrors } from '@/schemas/zodFieldErrors';

const MEDIA_ID_MAX_LENGTH = 64;
const DEFAULT_MEDIA_ID = 'media';

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

export function validateRegistrationDraftMediaUploadLimits(
  existingMedia: readonly DraftMedia[],
  files: readonly File[],
): RegistrationDraftMediaUploadLimitsResult {
  if (existingMedia.length + files.length > PUBLIC_MEDIA_ITEM_LIMIT) {
    return {
      ok: false,
      errorMessage: `Listings support up to ${MEDIA_STEP_GUIDANCE.itemLimit} media items.`,
    };
  }

  const existingVideoCount = existingMedia.filter(
    (media) => media.kind === 'video',
  ).length;
  const newVideoCount = files.filter(
    (file) => file.type.toLowerCase() === DAPP_INDEX_VIDEO_MIME_TYPE,
  ).length;
  if (existingVideoCount + newVideoCount > PUBLIC_MEDIA_VIDEO_LIMIT) {
    return {
      ok: false,
      errorMessage: `Listings support up to ${MEDIA_STEP_GUIDANCE.videoLimitCount} videos.`,
    };
  }

  const existingTotalSize = existingMedia.reduce(
    (total, media) => total + media.size,
    0,
  );
  const newTotalSize = files.reduce((total, file) => total + file.size, 0);
  if (
    existingTotalSize + newTotalSize >
    PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES
  ) {
    return {
      ok: false,
      errorMessage: `Total media size must stay under ${MEDIA_STEP_GUIDANCE.totalLimit}.`,
    };
  }

  return { ok: true };
}

export function createRegistrationDraftMediaUploadInput(
  file: File,
  existingMediaIds: readonly string[],
): RegistrationDraftMediaUploadInputResult {
  const mimeType = file.type.toLowerCase();
  if (!RegistrationDraftMediaUploadMimeSchema.safeParse(mimeType).success) {
    return {
      ok: false,
      errorMessage: 'Use PNG, JPEG, WebP, or WebM media.',
    };
  }

  const kind =
    mimeType === DAPP_INDEX_VIDEO_MIME_TYPE ? 'video' : 'screenshot';
  const sizeValidation = validateDraftMediaFile({
    kind,
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
      id: createRegistrationMediaId(file.name, existingMediaIds),
      kind,
      role: getDefaultMediaRoleForKind(kind),
      name: file.name,
      mimeType,
    },
  };
}

export function createRegistrationMediaId(
  fileName: string,
  existingMediaIds: readonly string[],
): string {
  const existingIds = new Set(existingMediaIds);
  const baseId = normalizeMediaId(stripFileExtension(fileName));

  for (let index = 1; ; index += 1) {
    const suffix = index === 1 ? '' : `-${index}`;
    const id = `${baseId.slice(0, MEDIA_ID_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!existingIds.has(id)) return id;
  }
}

export function validateRegistrationDraftMediaStep(
  media: readonly DraftMedia[],
): {
  ok: boolean;
  errors: RegistrationDraftMediaErrors;
} {
  const parsed = RegistrationDraftMediaStepSchema.safeParse(media);
  if (parsed.success) {
    return { ok: true, errors: {} };
  }

  return {
    ok: false,
    errors: zodMediaStepErrors(parsed.error.issues, media),
  };
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

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function normalizeMediaId(value: string): string {
  const id = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MEDIA_ID_MAX_LENGTH)
    .replace(/-+$/g, '');

  return id || DEFAULT_MEDIA_ID;
}
