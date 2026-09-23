import { viteLegacyCloudFrontHost, viteMediaCdnBase } from '@/chain/env';
import { HttpsUrlSchema } from '@/schemas/shared';

/**
 * Resolve a listing media/metadata URI to a browser-fetchable URL.
 * Passes through HTTPS CDN URLs (rewriting this project's own legacy
 * CloudFront distribution host to the public media CDN, when configured);
 * maps walrus://blob/<id> via the provided Walrus aggregator helper when
 * present.
 */
export function resolveMediaUrl(
  uri: string,
  options?: {
    resolveWalrusBlobId?: (blobId: string) => string | null;
    /** Override CDN origin used when rewriting the legacy CloudFront host. */
    mediaCdnBase?: string;
    /** Override the legacy CloudFront hostname eligible for rewriting. */
    legacyCloudFrontHost?: string;
  },
): string | null {
  const trimmed = uri.trim();
  if (trimmed === '') return null;

  const httpsUrl = HttpsUrlSchema.safeParse(trimmed);
  if (httpsUrl.success) {
    return rewriteLegacyCloudFrontMediaUrl(
      httpsUrl.data,
      options?.mediaCdnBase,
      options?.legacyCloudFrontHost,
    );
  }

  const walrusMatch = /^walrus:\/\/blob\/(.+)$/i.exec(trimmed);
  if (walrusMatch) {
    return options?.resolveWalrusBlobId?.(walrusMatch[1]) ?? null;
  }

  return null;
}

/**
 * Infra may have previously returned this project's own CloudFront
 * distribution domain as `publicUrl`. Rewrite that exact host to the public
 * CDN so already-published listings still load without republishing.
 *
 * Matches only the configured legacy host, not every `*.cloudfront.net`
 * domain — a builder-referenced URL on a third-party distribution must not
 * be redirected to a path that generally won't exist on our CDN.
 */
function rewriteLegacyCloudFrontMediaUrl(
  url: string,
  mediaCdnBase?: string,
  legacyCloudFrontHost?: string,
): string {
  const legacyHost = (
    legacyCloudFrontHost ?? viteLegacyCloudFrontHost()
  )?.toLowerCase();
  if (!legacyHost) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.hostname.toLowerCase() !== legacyHost) {
    return url;
  }

  const base = (mediaCdnBase ?? viteMediaCdnBase()).replace(/\/+$/, '');
  return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
}
