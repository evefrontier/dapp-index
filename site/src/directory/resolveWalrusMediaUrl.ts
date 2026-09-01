import { viteWalrusAggregatorUrl } from '@/chain/env';
import { rewriteWalrusAggregatorMetadataFetchUrl } from '@/chain/walrusProxy';
import { walrusBlobReadUrl } from '@/chain/walrusClient';
import type {
  DappIndexEntry,
  DappIndexImageMediaItem,
  DappIndexMediaItem,
} from '@/types/dapp-index';

export function resolveWalrusBlobReadUrl(uri: string): string | null {
  const match = /^walrus:\/\/blob\/(.+)$/i.exec(uri.trim());
  if (!match?.[1]) return null;

  const aggregator = viteWalrusAggregatorUrl();
  if (!aggregator) return null;
  return walrusBlobReadUrl(aggregator, match[1]);
}

export type ResolveWalrusMetadataFetchUrlOptions = {
  origin?: string;
  devProxy?: boolean;
};

/** Browser-fetch URL for on-chain `metadata_uri` (Walrus blob or aggregator HTTPS). */
export function resolveWalrusMetadataFetchUrl(
  uri: string,
  options: ResolveWalrusMetadataFetchUrlOptions = {},
): string {
  const readUrl = resolveWalrusBlobReadUrl(uri) ?? uri.trim();
  if (options.origin && options.devProxy) {
    return rewriteWalrusAggregatorMetadataFetchUrl(readUrl, {
      origin: options.origin,
      devProxy: true,
    });
  }
  return readUrl;
}

/** Human-readable link target for Walrus metadata (no dev proxy rewrite). */
export function resolveWalrusMetadataReadUrl(uri: string): string {
  return resolveWalrusBlobReadUrl(uri) ?? uri.trim();
}

export function findMediaItemById(
  entry: DappIndexEntry,
  mediaId: string | undefined,
): DappIndexMediaItem | undefined {
  if (!mediaId || !entry.media?.items) return undefined;
  return entry.media.items.find((item) => item.id === mediaId);
}

export function imageMediaItemReadUrl(
  item: DappIndexImageMediaItem | undefined,
): string | null {
  if (!item || item.kind !== 'image') return null;
  return resolveWalrusBlobReadUrl(item.uri);
}

export function firstImageReadUrlByRole(
  entry: DappIndexEntry,
  role: 'logo' | 'thumbnail' | 'gallery',
): string | null {
  const item = entry.media?.items.find(
    (media) => media.kind === 'image' && media.role === role,
  );
  return imageMediaItemReadUrl(item as DappIndexImageMediaItem | undefined);
}
