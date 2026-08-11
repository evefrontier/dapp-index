import {
  type DynamicFieldPage,
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient,
  type SuiObjectResponse,
} from '@mysten/sui/jsonRpc';
import {
  registryConfigured,
  viteRegistryId,
  viteSuiNetwork,
} from '@/chain/env';
import type { OnChainListing } from '@/chain/slugLookup';
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
import { mapWithConcurrency } from '@/utils/mapWithConcurrency';

const ALLOWED_CATEGORY = new Set<string>(
  DAPP_INDEX_CATEGORIES.map((category) => category.id),
);
const METADATA_TIMEOUT_MS = 6_000;
const DYNAMIC_FIELD_OBJECT_CONCURRENCY = 8;
const METADATA_FETCH_CONCURRENCY = 6;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function fromBase64ish(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function moveStringToUtf8(value: unknown): string | null {
  if (typeof value === 'string') return value;
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.bytes === 'string') {
    try {
      return new TextDecoder().decode(fromBase64ish(record.bytes));
    } catch {
      return null;
    }
  }
  if (Array.isArray(record.bytes)) {
    return new TextDecoder().decode(Uint8Array.from(record.bytes));
  }
  return null;
}

function coerceU8Vector(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const out: number[] = [];
  for (const byte of value) {
    if (
      typeof byte !== 'number' ||
      !Number.isInteger(byte) ||
      byte < 0 ||
      byte > 255
    ) {
      return null;
    }
    out.push(byte);
  }
  return out;
}

function parseListingFields(
  fields: Record<string, unknown>,
): OnChainListing | null {
  const owner = typeof fields.owner === 'string' ? fields.owner : null;
  const slug = moveStringToUtf8(fields.slug);
  const metadata_uri = moveStringToUtf8(fields.metadata_uri);
  const metadata_hash = coerceU8Vector(fields.metadata_hash);
  const categoriesRaw = fields.categories;
  if (
    !owner ||
    !slug ||
    !metadata_uri ||
    !metadata_hash ||
    !Array.isArray(categoriesRaw)
  ) {
    return null;
  }

  const categories: string[] = [];
  for (const category of categoriesRaw) {
    const normalized = moveStringToUtf8(category);
    if (!normalized) return null;
    categories.push(normalized);
  }

  return { owner, slug, metadata_uri, metadata_hash, categories };
}

function extractListingFromMoveObjectContent(
  content: unknown,
): OnChainListing | null {
  const record = asRecord(content);
  if (!record || record.dataType !== 'moveObject') return null;
  const fields = asRecord(record.fields);
  if (!fields) return null;
  if ('value' in fields) {
    const inner = asRecord(fields.value);
    if (inner) {
      const innerFields = asRecord(inner.fields);
      return parseListingFields(innerFields ?? inner);
    }
  }
  if ('owner' in fields && 'slug' in fields) {
    return parseListingFields(fields);
  }
  return null;
}

function parseListingObject(response: SuiObjectResponse): OnChainListing | null {
  const data = response.data;
  if (!data?.content) return null;
  return extractListingFromMoveObjectContent(data.content);
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

export async function fetchOnChainCatalogEntries(): Promise<DappIndexEntry[]> {
  if (!registryConfigured()) return [];

  const registryId = viteRegistryId();
  if (!registryId) return [];

  const network = viteSuiNetwork();
  const client = new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl(network),
    network,
  });
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

    let page: DynamicFieldPage;
    try {
      page = await withTimeout(
        client.getDynamicFields({
          parentId: registryId,
          cursor,
        }),
        REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS,
        'registry getDynamicFields',
      );
    } catch (error) {
      console.warn('[registry-catalog] Failed to list dynamic fields:', error);
      break;
    }

    const listingsOnPage = (
      await mapWithConcurrency(
        page.data,
        DYNAMIC_FIELD_OBJECT_CONCURRENCY,
        async (field) => {
          try {
            const object = await withTimeout(
              client.getDynamicFieldObject({
                parentId: registryId,
                name: field.name,
              }),
              REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS,
              'registry getDynamicFieldObject',
            );
            return parseListingObject(object);
          } catch (error) {
            console.warn('[registry-catalog] Failed to read listing object:', error);
            return null;
          }
        },
      )
    ).filter((listing): listing is OnChainListing => listing !== null);

    const entriesOnPage = await mapWithConcurrency(
      listingsOnPage,
      METADATA_FETCH_CONCURRENCY,
      async (listing) => {
        try {
          return await withTimeout(
            listingToDisplayEntry(listing),
            METADATA_TIMEOUT_MS + 1_500,
            'registry listingToDisplayEntry',
          );
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
    cursor = page.nextCursor ?? null;
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}
