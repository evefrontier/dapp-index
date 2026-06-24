import { fetchOnChainCatalogEntries } from '@/chain/registryCatalog';
import { registryConfigured } from '@/chain/env';
import { applyDevCatalogFixtures } from '@/content/devCatalogFixtures';
import { listDappIndexFixtures } from '@/content/dappIndexFixtures';
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

function finalizeCatalogEntries(entries: DappIndexEntry[]): DappIndexEntry[] {
  return applyDevCatalogFixtures(entries);
}

async function loadCatalog(): Promise<DappIndexEntry[]> {
  if (registryConfigured()) {
    try {
      const entries = await fetchOnChainCatalogEntries();
      if (entries.length > 0) return finalizeCatalogEntries(entries);
    } catch (error) {
      console.warn('[dapp-catalog] On-chain registry read failed:', error);
    }
  }

  return finalizeCatalogEntries(listDappIndexFixtures());
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
