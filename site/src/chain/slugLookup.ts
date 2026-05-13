import {
  type DynamicFieldPage,
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient,
  type SuiObjectResponse,
} from '@mysten/sui/jsonRpc';
import { registryConfigured, viteRegistryId, viteSuiNetwork } from '@/chain/env';

const RPC_TIMEOUT_MS = 8_000;
const SLUG_LOOKUP_MAX_PAGES = 50;

export type OnChainListing = {
  owner: string;
  slug: string;
  metadata_uri: string;
  metadata_hash: number[];
  categories: string[];
};

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
      if (item === undefined) break;
      results[i] = await fn(item, i);
    }
  }
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

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

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function fromBase64ish(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function moveStringToUtf8(value: unknown): string | null {
  if (typeof value === 'string') return value;
  const r = asRecord(value);
  if (!r) return null;
  if (typeof r.bytes === 'string') {
    try {
      return new TextDecoder().decode(fromBase64ish(r.bytes));
    } catch {
      return null;
    }
  }
  if (Array.isArray(r.bytes)) {
    return new TextDecoder().decode(Uint8Array.from(r.bytes));
  }
  return null;
}

function coerceU8Vector(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const out: number[] = [];
  for (const x of value) {
    if (typeof x !== 'number' || !Number.isInteger(x) || x < 0 || x > 255) {
      return null;
    }
    out.push(x);
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
  const catsRaw = fields.categories;
  if (
    !owner ||
    !slug ||
    !metadata_uri ||
    !metadata_hash ||
    !Array.isArray(catsRaw)
  ) {
    return null;
  }
  const categories: string[] = [];
  for (const c of catsRaw) {
    const s = moveStringToUtf8(c);
    if (!s) return null;
    categories.push(s);
  }
  return { owner, slug, metadata_uri, metadata_hash, categories };
}

function extractListingFromMoveObjectContent(
  content: unknown,
): OnChainListing | null {
  const c = asRecord(content);
  if (!c || c.dataType !== 'moveObject') return null;
  const fields = asRecord(c.fields);
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

function parseListingObject(resp: SuiObjectResponse): OnChainListing | null {
  const data = resp.data;
  if (!data?.content) return null;
  return extractListingFromMoveObjectContent(data.content);
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
    if (pagesRead >= SLUG_LOOKUP_MAX_PAGES) {
      return {
        status: 'error',
        message: `Slug lookup stopped after ${SLUG_LOOKUP_MAX_PAGES} pages (registry very large). Try again later or ask for an indexed slug API.`,
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
      page = await withTimeout(
        client.getDynamicFields({
          parentId: registryId,
          cursor,
        }),
        RPC_TIMEOUT_MS,
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
        obj = await withTimeout(
          client.getDynamicFieldObject({
            parentId: registryId,
            name: df.name,
          }),
          RPC_TIMEOUT_MS,
          'slug lookup getDynamicFieldObject',
        );
      } catch {
        continue;
      }
      const listing = parseListingObject(obj);
      if (!listing) continue;
      if (listing.slug === normalized) {
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
