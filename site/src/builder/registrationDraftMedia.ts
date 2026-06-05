import type { DraftMediaInput } from '@/storage/draftStorage';
import {
  DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/types/dapp-index';

const MEDIA_ID_MAX_LENGTH = 64;
const DEFAULT_MEDIA_ID = 'media';
const DEFAULT_MEDIA_ROLE = 'gallery';
const IMAGE_MIME_TYPE_VALUES: ReadonlySet<string> = new Set(
  DAPP_INDEX_IMAGE_MIME_TYPES,
);

export type RegistrationDraftMediaUploadInputResult =
  | { ok: true; input: DraftMediaInput }
  | { ok: false; errorMessage: string };

export function createRegistrationDraftMediaUploadInput(
  file: File,
  existingMediaIds: readonly string[],
): RegistrationDraftMediaUploadInputResult {
  const mimeType = file.type.toLowerCase();
  const kind = getDraftMediaKind(mimeType);
  if (!kind) {
    return {
      ok: false,
      errorMessage: 'Use PNG, JPEG, WebP, or WebM media.',
    };
  }

  return {
    ok: true,
    input: {
      id: createRegistrationMediaId(file.name, existingMediaIds),
      kind,
      role: DEFAULT_MEDIA_ROLE,
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

function getDraftMediaKind(
  mimeType: string,
): DraftMediaInput['kind'] | null {
  if (IMAGE_MIME_TYPE_VALUES.has(mimeType)) {
    return 'screenshot';
  }

  return mimeType === DAPP_INDEX_VIDEO_MIME_TYPE ? 'video' : null;
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
