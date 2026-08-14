/**
 * On-chain registry catalog over gRPC.
 *
 * Lists dynamic fields on the shared DappRegistry, decodes each field's
 * `DappListing` value from BCS, then hydrates display entries by fetching the
 * listing metadata document (Walrus or HTTPS CDN).
 */

import {
  registryConfigured,
  viteRegistryId,
  viteSuiNetwork,
} from '@/chain/env';
import {
  parseDappListingBcs,
  type OnChainListing,
} from '@/chain/registryListingBcs';
import { createSuiGrpcClient } from '@/chain/suiGrpcClient';
import {
  DAPP_INDEX_CATEGORIES,
  REGISTRY_SLUG_LOOKUP_MAX_PAGES,
  REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS,
} from '@/constants';
import { parseDappIndexMetadataJson } from '@/directory/parseDappIndexMetadata';
import { resolveWalrusMetadataFetchUrl } from '@/directory/resolveWalrusMediaUrl';
import type {
  DappIndexCategoryId,
  DappIndexEntry,
  DappIndexServerTenant,
} from '@/types/dapp-index';
import { canonicalStringify, sha256Utf8Bytes } from '@/utils/canonicalJson';

const ALLOWED_CATEGORY = new Set<string>(
  DAPP_INDEX_CATEGORIES.map((category) => category.id),
);
const METADATA_TIMEOUT_MS = 6_000;
const METADATA_FETCH_CONCURRENCY = 6;
const DYNAMIC_FIELDS_PAGE_SIZE = 50;

export type CatalogDynamicFieldPage = {
  dynamicFields: Array<{
    value?: { type: string; bcs: Uint8Array };
  }>;
  cursor: string | null;
  hasNextPage: boolean;
};

export type ListCatalogDynamicFields = (input: {
  parentId: string;
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}) => Promise<CatalogDynamicFieldPage>;

export type FetchOnChainCatalogOptions = {
  /** Injectable for tests. Defaults to gRPC `listDynamicFields` with values. */
  listDynamicFields?: ListCatalogDynamicFields;
  /** Injectable registry object id for tests. */
  registryId?: string;
};

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Math.max(1, Math.min(concurrency, items.length));

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) break;
      const item = items[i];
      if (item === undefined) continue;
      results[i] = await fn(item, i);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

function normalizeCategories(raw: string[]): DappIndexCategoryId[] {
  const categories = raw.filter((category): category is DappIndexCategoryId =>
    ALLOWED_CATEGORY.has(category),
  );
  return categories.length > 0 ? categories : ['build'];
}

function bytesToHex(bytes: readonly number[]): string {
  return `0x${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function bytesEqual(left: Uint8Array, right: number[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== (right[index] ?? 0)) return false;
  }
  return true;
}

async function fetchMetadataJson(
  uri: string,
): Promise<{ text: string; json: unknown } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);
  const browserOrigin =
    typeof window !== 'undefined' ? window.location.origin : null;
  const fetchUrl = resolveWalrusMetadataFetchUrl(uri, {
    origin: browserOrigin ?? undefined,
    devProxy: import.meta.env.DEV,
  });

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const text = await response.text();
    const json = JSON.parse(text) as unknown;
    return { text, json };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function fallbackEntry(listing: OnChainListing): DappIndexEntry {
  return {
    schema: 'evefrontier.dapp-index.metadata',
    schemaVersion: 1,
    id: listing.slug,
    name: listing.slug,
    summary: `On-chain listing (metadata not loaded). URI: ${listing.metadata_uri}`,
    categories: normalizeCategories(listing.categories),
    liveUrl: listing.metadata_uri,
    suiPackages: [],
    metadataUri: listing.metadata_uri,
    metadataHash: bytesToHex(listing.metadata_hash),
    registryOwner: listing.owner,
    serverTenant: 'stillness' satisfies DappIndexServerTenant,
  };
}

async function listingToDisplayEntry(
  listing: OnChainListing,
): Promise<DappIndexEntry> {
  const metadata = await fetchMetadataJson(listing.metadata_uri);
  const parsed = metadata
    ? parseDappIndexMetadataJson(metadata.json)
    : null;

  if (metadata && parsed?.ok) {
    try {
      const hash = await sha256Utf8Bytes(canonicalStringify(metadata.json));
      if (!bytesEqual(hash, listing.metadata_hash)) {
        console.warn(
          `[registry-catalog] metadata hash mismatch for slug=${listing.slug}`,
        );
      }
    } catch {
      // Ignore hash errors.
    }

    return {
      ...parsed.entry,
      metadataUri: listing.metadata_uri,
      metadataHash: bytesToHex(listing.metadata_hash),
      registryOwner: listing.owner,
    };
  }

  return fallbackEntry(listing);
}

function createDefaultListDynamicFields(): ListCatalogDynamicFields {
  const client = createSuiGrpcClient(viteSuiNetwork());
  return async ({ parentId, cursor, limit }) => {
    const page = await client.listDynamicFields({
      parentId,
      cursor: cursor ?? undefined,
      limit,
      include: { value: true },
    });
    return {
      dynamicFields: page.dynamicFields.map((field) => ({
        value: field.value
          ? { type: field.value.type, bcs: field.value.bcs }
          : undefined,
      })),
      cursor: page.cursor,
      hasNextPage: page.hasNextPage,
    };
  };
}

export async function fetchOnChainCatalogEntries(
  options: FetchOnChainCatalogOptions = {},
): Promise<DappIndexEntry[]> {
  const listDynamicFields = options.listDynamicFields;
  const registryId = options.registryId ?? viteRegistryId();

  if (!listDynamicFields && !registryConfigured()) return [];
  if (!registryId) return [];

  const listFields = listDynamicFields ?? createDefaultListDynamicFields();
  const entries: DappIndexEntry[] = [];
  let cursor: string | null | undefined;
  const seenCursors = new Set<string | null>();
  let pagesRead = 0;

  while (true) {
    if (pagesRead >= REGISTRY_SLUG_LOOKUP_MAX_PAGES) {
      console.warn(
        `[registry-catalog] Stopping after ${REGISTRY_SLUG_LOOKUP_MAX_PAGES} pages.`,
      );
      break;
    }
    if (seenCursors.has(cursor ?? null)) {
      console.warn('[registry-catalog] Repeated pagination cursor detected.');
      break;
    }
    seenCursors.add(cursor ?? null);
    pagesRead += 1;

    let page: CatalogDynamicFieldPage;
    try {
      page = await listFields({
        parentId: registryId,
        cursor,
        limit: DYNAMIC_FIELDS_PAGE_SIZE,
        signal: AbortSignal.timeout(REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS),
      });
    } catch (error) {
      console.warn('[registry-catalog] Failed to list dynamic fields:', error);
      break;
    }

    const listingsOnPage = page.dynamicFields
      .map((field) =>
        field.value?.bcs ? parseDappListingBcs(field.value.bcs) : null,
      )
      .filter((listing): listing is OnChainListing => listing !== null);

    const entriesOnPage = await mapWithConcurrency(
      listingsOnPage,
      METADATA_FETCH_CONCURRENCY,
      async (listing) => {
        try {
          return await listingToDisplayEntry(listing);
        } catch (error) {
          console.warn('[registry-catalog] Failed to map listing entry:', error);
          return null;
        }
      },
    );

    for (const entry of entriesOnPage) {
      if (entry) entries.push(entry);
    }

    if (!page.hasNextPage) break;
    cursor = page.cursor;
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}
