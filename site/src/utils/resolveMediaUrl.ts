import { viteMediaCdnBase } from '@/chain/env';
import { HttpsUrlSchema } from '@/schemas/shared';

/**
 * Resolve a listing media/metadata URI to a browser-fetchable URL.
 * Passes through HTTPS CDN URLs (rewriting legacy `*.cloudfront.net` hosts to
 * the public media CDN); maps walrus://blob/<id> via the provided Walrus
 * aggregator helper when present.
 */
export function resolveMediaUrl(
  uri: string,
  options?: {
    resolveWalrusBlobId?: (blobId: string) => string | null;
    /** Override CDN origin used when rewriting CloudFront hosts. */
    mediaCdnBase?: string;
  },
): string | null {
  const trimmed = uri.trim();
  if (trimmed === '') return null;

  const httpsUrl = HttpsUrlSchema.safeParse(trimmed);
  if (httpsUrl.success) {
    return rewriteLegacyCloudFrontMediaUrl(httpsUrl.data, options?.mediaCdnBase);
  }

  const walrusMatch = /^walrus:\/\/blob\/(.+)$/i.exec(trimmed);
  if (walrusMatch) {
    return options?.resolveWalrusBlobId?.(walrusMatch[1]) ?? null;
  }

  return null;
}

/**
 * Infra may have previously returned the distribution domain as `publicUrl`.
 * Rewrite those hosts to the public CDN so already-published listings still
 * load without republishing.
 */
function rewriteLegacyCloudFrontMediaUrl(
  url: string,
  mediaCdnBase?: string,
): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!parsed.hostname.toLowerCase().endsWith('.cloudfront.net')) {
    return url;
  }

  const base = (mediaCdnBase ?? viteMediaCdnBase()).replace(/\/+$/, '');
  return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
}
