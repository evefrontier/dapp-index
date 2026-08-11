import { putPresignedObject } from './s3Put';
import { presignUpload, type PresignPurpose } from './uploadApi';

export type S3UploadResult = {
  uri: string;
  objectKey: string;
  sha256: string;
  sizeBytes: number;
};

export type UploadMediaToS3Input = {
  address: string;
  slug: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  sha256: string;
  apiBase?: string;
  fetchImpl?: typeof fetch;
};

export type UploadManifestToS3Input = {
  address: string;
  slug: string;
  bytes: Uint8Array;
  sha256: string;
  apiBase?: string;
  fetchImpl?: typeof fetch;
};

export async function uploadMediaToS3(
  input: UploadMediaToS3Input,
): Promise<S3UploadResult> {
  return uploadBytes({
    address: input.address,
    slug: input.slug,
    purpose: 'media',
    filename: input.filename,
    contentType: input.contentType,
    bytes: input.bytes,
    sha256: input.sha256,
    apiBase: input.apiBase,
    fetchImpl: input.fetchImpl,
  });
}

export async function uploadManifestToS3(
  input: UploadManifestToS3Input,
): Promise<S3UploadResult> {
  return uploadBytes({
    address: input.address,
    slug: input.slug,
    purpose: 'manifest',
    filename: 'metadata.json',
    contentType: 'application/json',
    bytes: input.bytes,
    sha256: input.sha256,
    apiBase: input.apiBase,
    fetchImpl: input.fetchImpl,
  });
}

async function uploadBytes(input: {
  address: string;
  slug: string;
  purpose: PresignPurpose;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  sha256: string;
  apiBase?: string;
  fetchImpl?: typeof fetch;
}): Promise<S3UploadResult> {
  const sizeBytes = input.bytes.byteLength;
  const presign = await presignUpload({
    address: input.address,
    slug: input.slug,
    purpose: input.purpose,
    filename: input.filename,
    contentType: input.contentType,
    contentLength: sizeBytes,
    sha256: input.sha256,
    apiBase: input.apiBase,
    fetchImpl: input.fetchImpl,
  });

  await putPresignedObject({
    uploadUrl: presign.uploadUrl,
    headers: presign.headers,
    body: toRequestBody(input.bytes),
    fetchImpl: input.fetchImpl,
  });

  return {
    uri: presign.publicUrl,
    objectKey: presign.objectKey,
    sha256: input.sha256,
    sizeBytes,
  };
}

function toRequestBody(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer]);
}

/** Stable object filename for a media slot id + mime type. */
export function stableMediaFilename(mediaId: string, mimeType: string): string {
  const extension = extensionForMimeType(mimeType);
  const safeId = mediaId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return `${safeId || 'media'}.${extension}`;
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'video/webm':
      return 'webm';
    case 'application/json':
      return 'json';
    default:
      return 'bin';
  }
}
