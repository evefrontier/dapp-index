export type UploadErrorCode =
  | 'upload_api_unconfigured'
  | 'presign_network'
  | 'presign_http'
  | 'presign_invalid_response'
  | 'put_network'
  | 'put_http'
  | 'cancelled';

export class UploadError extends Error {
  readonly code: UploadErrorCode;
  readonly status: number | null;

  constructor(
    code: UploadErrorCode,
    message: string,
    options?: { status?: number | null; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'UploadError';
    this.code = code;
    this.status = options?.status ?? null;
  }
}

export function isUploadError(value: unknown): value is UploadError {
  return value instanceof UploadError;
}
