import { viteUploadApiBase } from '@/chain/env';
import { HttpsUrlSchema } from '@/schemas/shared';
import { UploadError } from './uploadErrors';

export type PresignPurpose = 'media' | 'manifest';

export type PresignUploadInput = {
  address: string;
  slug: string;
  purpose: PresignPurpose;
  filename: string;
  contentType: string;
  contentLength: number;
  sha256: string;
  /** Injectable for tests. Defaults to `viteUploadApiBase()`. */
  apiBase?: string;
  fetchImpl?: typeof fetch;
};

export type PresignUploadResult = {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  objectKey: string;
  publicUrl: string;
  expiresInSeconds?: number;
};

export async function presignUpload(
  input: PresignUploadInput,
): Promise<PresignUploadResult> {
  const apiBase = (input.apiBase ?? viteUploadApiBase())?.replace(/\/+$/, '');
  if (!apiBase) {
    throw new UploadError(
      'upload_api_unconfigured',
      'Upload API is not configured.',
    );
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(`${apiBase}/uploads/presign`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        address: input.address,
        slug: input.slug,
        purpose: input.purpose,
        filename: input.filename,
        contentType: input.contentType,
        contentLength: input.contentLength,
        sha256: input.sha256,
      }),
    });
  } catch (cause) {
    throw new UploadError(
      'presign_network',
      'Could not reach upload service.',
      { cause },
    );
  }

  const bodyText = await response.text();
  const parsed = parseJsonObject(bodyText);

  if (!response.ok) {
    const detail =
      typeof parsed?.message === 'string' && parsed.message.trim() !== ''
        ? parsed.message.trim()
        : `HTTP ${response.status}`;
    throw new UploadError(
      'presign_http',
      `Upload service rejected the request (${detail}).`,
      { status: response.status },
    );
  }

  if (!parsed) {
    throw new UploadError(
      'presign_invalid_response',
      'Upload service returned an incomplete response.',
      { status: response.status },
    );
  }

  const uploadUrl = requireHttpsUrl(parsed.uploadUrl, 'uploadUrl');
  const objectKey = requireNonEmptyString(parsed.objectKey, 'objectKey');
  const publicUrl = requireHttpsUrl(parsed.publicUrl, 'publicUrl');
  const headers = normalizeHeaders(parsed.headers);

  return {
    uploadUrl,
    method: 'PUT',
    headers,
    objectKey,
    publicUrl,
    expiresInSeconds:
      typeof parsed.expiresInSeconds === 'number'
        ? parsed.expiresInSeconds
        : undefined,
  };
}

function parseJsonObject(bodyText: string): Record<string, unknown> | null {
  if (bodyText.trim() === '') return null;
  try {
    const value: unknown = JSON.parse(bodyText);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new UploadError(
      'presign_invalid_response',
      `Upload service returned an incomplete response (missing ${field}).`,
    );
  }
  return value.trim();
}

function requireHttpsUrl(value: unknown, field: string): string {
  const result = HttpsUrlSchema.safeParse(value);
  if (!result.success) {
    throw new UploadError(
      'presign_invalid_response',
      `Upload service returned an invalid response (${field} must be an HTTPS URL).`,
    );
  }
  return result.data;
}

function normalizeHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new UploadError(
      'presign_invalid_response',
      'Upload service returned an incomplete response (missing headers).',
    );
  }

  const headers: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string' && entry.trim() !== '') {
      headers[key] = entry;
    }
  }
  return headers;
}
