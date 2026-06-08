import type { DraftMedia, DraftMediaInput } from '@/storage/draftStorage';
import { validateDraftMediaFile } from '@/storage/draftMediaValidation';
import { DAPP_INDEX_VIDEO_MIME_TYPE } from '@/constants';
import { getDefaultMediaRoleForKind } from './mediaRoleModel';
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
