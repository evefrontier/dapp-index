/** Official Walrus aggregator hosts (metadata JSON at `/v1/blobs/{blobId}`). */
const WALRUS_AGGREGATOR_TESTNET_HOST = 'aggregator.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR_MAINNET_HOST = 'aggregator.walrus-mainnet.walrus.space';

/** Vite dev-server proxy prefixes (see `site/vite.config.ts`). */
export const WALRUS_AGGREGATOR_PROXY_TESTNET = '/walrus-aggregator-testnet';
export const WALRUS_AGGREGATOR_PROXY_MAINNET = '/walrus-aggregator-mainnet';

/**
 * Rewrites Walrus aggregator HTTPS URLs to same-origin paths so the dev server
 * can proxy them and avoid browser CORS when hydrating on-chain `metadata_uri`.
 *
 * In production (`devProxy: false`) the original URI is returned unchanged; if
 * the aggregator sends permissive CORS for your deploy origin, fetch still works.
 */
export function rewriteWalrusAggregatorMetadataFetchUrl(
  uri: string,
  options: { origin: string; devProxy: boolean },
): string {
  if (!options.devProxy) return uri;
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return uri;
  }
  if (u.protocol !== 'https:') return uri;
  const { origin } = options;
  const host = u.hostname.toLowerCase();
  if (host === WALRUS_AGGREGATOR_TESTNET_HOST) {
    return `${origin}${WALRUS_AGGREGATOR_PROXY_TESTNET}${u.pathname}${u.search}`;
  }
  if (host === WALRUS_AGGREGATOR_MAINNET_HOST) {
    return `${origin}${WALRUS_AGGREGATOR_PROXY_MAINNET}${u.pathname}${u.search}`;
  }
  return uri;
}
