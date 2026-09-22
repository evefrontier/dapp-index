import type { AnySchema, ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
  PUBLIC_MEDIA_VIDEO_LIMIT,
} from '@/constants';
import registryEntrySchema from '../../../registry/schema/registry-entry.schema.json';

/** Draft 2020-12: matches `$schema` on `registry-entry.schema.json`. */
const ajv = new Ajv2020({ allErrors: true, strict: true });

const validateRegistryEntry = ajv.compile(
  registryEntrySchema as unknown as AnySchema,
);

export type RegistryMetadataValidation =
  | { ok: true }
  | { ok: false; errors: ErrorObject[] | null | undefined };

export function validateRegistryMetadataJson(
  data: unknown,
): RegistryMetadataValidation {
  const ok = validateRegistryEntry(data);
  if (!ok) {
    return { ok: false, errors: validateRegistryEntry.errors };
  }

  const semanticErrors = validateRegistryMetadataSemantics(data);
  if (semanticErrors.length > 0) {
    return { ok: false, errors: semanticErrors };
  }

  return { ok: true };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function customError(
  instancePath: string,
  message: string,
  keyword = 'metadataSemantics',
): ErrorObject {
  return {
    instancePath,
    schemaPath: '#/metadataSemantics',
    keyword,
    params: {},
    message,
  };
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function validateRegistryMetadataSemantics(data: unknown): ErrorObject[] {
  const errors: ErrorObject[] = [];
  const root = asRecord(data);
  const media = asRecord(root?.media);
  const items = Array.isArray(media?.items) ? media.items : null;
  if (!media || !items) return errors;

  const mediaIds = new Set<string>();
  let videoCount = 0;
  let totalMediaSizeBytes = 0;

  items.forEach((item, index) => {
    const entry = asRecord(item);
    if (!entry) return;

    const id = typeof entry.id === 'string' ? entry.id : undefined;
    if (id) {
      if (mediaIds.has(id)) {
        errors.push(
          customError(`/media/items/${index}/id`, `duplicate media id "${id}"`),
        );
      }
      mediaIds.add(id);
    }

    if (entry.kind === 'image') {
      totalMediaSizeBytes += numberValue(entry.sizeBytes);
      return;
    }

    if (entry.kind !== 'video') return;
    videoCount += 1;

    const poster = asRecord(entry.poster);
    totalMediaSizeBytes += numberValue(poster?.sizeBytes);

    const sources = Array.isArray(entry.sources) ? entry.sources : [];
    sources.forEach((source) => {
      totalMediaSizeBytes += numberValue(asRecord(source)?.sizeBytes);
    });
  });

  for (const key of ['thumbnail'] as const) {
    const referencedId = media[key];
    if (typeof referencedId === 'string' && !mediaIds.has(referencedId)) {
      errors.push(
        customError(
          `/media/${key}`,
          `${key} must reference an id in media.items`,
        ),
      );
    }
  }

  if (videoCount > PUBLIC_MEDIA_VIDEO_LIMIT) {
    errors.push(
      customError(
        '/media/items',
        `media may include at most ${PUBLIC_MEDIA_VIDEO_LIMIT} videos`,
      ),
    );
  }

  if (totalMediaSizeBytes > PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES) {
    errors.push(
      customError(
        '/media/items',
        `total public media size may not exceed ${PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES} bytes`,
      ),
    );
  }

  return errors;
}
