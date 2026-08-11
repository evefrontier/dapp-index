import { HttpsUrlSchema } from '@/schemas/shared';

/**
 * Resolve a listing media/metadata URI to a browser-fetchable URL.
 * Passes through HTTPS CDN URLs; maps walrus://blob/<id> via the provided
 * Walrus aggregator helper when present.
 */
export function resolveMediaUrl(
  uri: string,
  options?: {
    resolveWalrusBlobId?: (blobId: string) => string | null;
  },
): string | null {
  const trimmed = uri.trim();
  if (trimmed === '') return null;

  const httpsUrl = HttpsUrlSchema.safeParse(trimmed);
  if (httpsUrl.success) {
    return httpsUrl.data;
  }

  const walrusMatch = /^walrus:\/\/blob\/(.+)$/i.exec(trimmed);
  if (walrusMatch) {
    return options?.resolveWalrusBlobId?.(walrusMatch[1]) ?? null;
  }

  return null;
}
