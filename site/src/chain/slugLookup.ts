import {
  type DynamicFieldPage,
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient,
  type SuiObjectResponse,
} from '@mysten/sui/jsonRpc';
import { registryConfigured, viteRegistryId, viteSuiNetwork } from '@/chain/env';
import {
  type OnChainListing,
  parseRegistryListingObject,
} from '@/chain/registryListingObject';
import { withRpcTimeout } from '@/chain/rpcTimeout';
import {
  REGISTRY_SLUG_LOOKUP_MAX_PAGES,
  REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS,
} from '@/constants';

export type RegistrySlugLookupResult =
  | { status: 'unconfigured' }
  | { status: 'available' }
  | { status: 'taken'; listing: OnChainListing }
  | { status: 'error'; message: string };

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

/**
 * Best-effort on-chain slug lookup by scanning the registry object's dynamic fields.
 *
 * This is O(number of listings) RPC work. For very large registries, consider an
 * off-chain index later; for early testnets this is fine.
 */
export async function lookupRegistrySlug(
  slug: string,
): Promise<RegistrySlugLookupResult> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return { status: 'error', message: 'Slug is empty.' };
  }
  if (!registryConfigured()) return { status: 'unconfigured' };

  const registryId = viteRegistryId();
  if (!registryId) return { status: 'unconfigured' };

  const network = viteSuiNetwork();
  const client = new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl(network),
    network,
  });

  let cursor: string | null | undefined;
  const seenCursors = new Set<string | null>();
  let pagesRead = 0;

  while (true) {
    if (pagesRead >= REGISTRY_SLUG_LOOKUP_MAX_PAGES) {
      return {
        status: 'error',
        message: `Slug lookup stopped after ${REGISTRY_SLUG_LOOKUP_MAX_PAGES} pages (registry very large). Try again later or ask for an indexed slug API.`,
      };
    }
    if (seenCursors.has(cursor ?? null)) {
      return {
        status: 'error',
        message: 'Slug lookup pagination loop detected.',
      };
    }
    seenCursors.add(cursor ?? null);
    pagesRead += 1;

    let page: DynamicFieldPage;
    try {
      page = await withRpcTimeout(
        client.getDynamicFields({
          parentId: registryId,
          cursor,
        }),
        REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS,
        'slug lookup getDynamicFields',
      );
    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : String(e),
      };
    }

    for (const df of page.data) {
      let obj: SuiObjectResponse;
      try {
        obj = await withRpcTimeout(
          client.getDynamicFieldObject({
            parentId: registryId,
            name: df.name,
          }),
          REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS,
          'slug lookup getDynamicFieldObject',
        );
      } catch {
        continue;
      }
      const listing = parseRegistryListingObject(obj);
      if (!listing) continue;
      if (listing.slug.trim().toLowerCase() === normalized) {
        return { status: 'taken', listing };
      }
    }

    if (!page.hasNextPage) {
      break;
    }
    cursor = page.nextCursor ?? null;
  }

  return { status: 'available' };
}

export { mapWithConcurrency };
