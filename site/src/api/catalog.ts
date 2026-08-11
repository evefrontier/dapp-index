import { fetchOnChainCatalogEntries } from '@/chain/registryCatalog';
import { registryConfigured } from '@/chain/env';
import type { DappIndexEntry } from '@/types/dapp-index';

function catalogCacheKey(): string {
  return JSON.stringify({
    registry: registryConfigured(),
    registryId: import.meta.env.VITE_REGISTRY_ID?.trim() ?? '',
  });
}

const catalogPromises = new Map<string, Promise<DappIndexEntry[]>>();

export function resetDappCatalogCache(): void {
  catalogPromises.clear();
}

/**
 * Chain-only catalog: never inject local demo fixtures.
 * Empty registry or a failed read yields an empty list / error for the UI.
 */
async function loadCatalog(): Promise<DappIndexEntry[]> {
  if (!registryConfigured()) return [];

  try {
    return await fetchOnChainCatalogEntries();
  } catch (error) {
    console.warn('[dapp-catalog] On-chain registry read failed:', error);
    throw error;
  }
}

export async function fetchDappCatalog(): Promise<DappIndexEntry[]> {
  const key = catalogCacheKey();
  let promise = catalogPromises.get(key);
  if (!promise) {
    promise = loadCatalog();
    catalogPromises.set(key, promise);
  }
  return promise;
}

export async function fetchDappBySlug(
  slug: string,
): Promise<DappIndexEntry | undefined> {
  const entries = await fetchDappCatalog();
  return entries.find((entry) => entry.id === slug);
}
