import { registryConfigured, viteRegistryId, viteSuiNetwork } from '@/chain/env';
import {
  type OnChainListing,
  parseRegistryListingFieldBcs,
  registrySlugFieldId,
} from '@/chain/registryListingBcs';
import {
  createRegistryObjectReader,
  type RegistryObjectRead,
  type RegistryObjectReader,
} from '@/chain/registryObjectReader';
import { createSuiGrpcClient } from '@/chain/suiGrpcClient';
import { normalizeRegistrySlug } from '@/chain/normalizeRegistrySlug';
import { REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS } from '@/constants';

export type { OnChainListing };

export type RegistrySlugLookupResult =
  | { status: 'unconfigured' }
  | { status: 'available' }
  | { status: 'taken'; listing: OnChainListing }
  | { status: 'error'; message: string };

export type RegistrySlugLookupOptions = {
  /** Injectable object read so tests can run without a fullnode. */
  readObject?: RegistryObjectReader;
};

/**
 * Look up a registry slug by reading its dynamic field directly.
 *
 * Listings are keyed by slug, so the field's object id is derived locally and
 * fetched in a single request. A `NOT_FOUND` status means the slug is free;
 * anything else is reported as an error rather than silently read as available.
 */
export async function lookupRegistrySlug(
  slug: string,
  options: RegistrySlugLookupOptions = {},
): Promise<RegistrySlugLookupResult> {
  const normalized = normalizeRegistrySlug(slug);
  if (!normalized) {
    return { status: 'error', message: 'Slug is empty.' };
  }
  if (!registryConfigured()) return { status: 'unconfigured' };

  const registryId = viteRegistryId();
  if (!registryId) return { status: 'unconfigured' };

  const readObject =
    options.readObject ??
    createRegistryObjectReader(createSuiGrpcClient(viteSuiNetwork()));

  let read: RegistryObjectRead;
  try {
    read = await readObject(registrySlugFieldId(registryId, normalized), {
      signal: AbortSignal.timeout(REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  if (read.status === 'notFound') return { status: 'available' };
  if (read.status === 'failed') {
    return { status: 'error', message: read.message };
  }

  const listing = parseRegistryListingFieldBcs(read.contents);
  if (!listing) {
    return {
      status: 'error',
      message: 'Registry listing could not be decoded.',
    };
  }

  return { status: 'taken', listing };
}
