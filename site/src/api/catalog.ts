import { fetchOnChainCatalogEntries } from '@/chain/registryCatalog';
import { registryConfigured, viteFixtureDataEnabled } from '@/chain/env';
import { applyDevCatalogFixtures } from '@/content/devCatalogFixtures';
import { applyHiddenListings } from '@/content/hiddenListings';
import type { DappIndexEntry } from '@/types/dapp-index';

function catalogCacheKey(): string {
  return JSON.stringify({
    fixtures: viteFixtureDataEnabled(),
    registry: registryConfigured(),
    registryId: import.meta.env.VITE_REGISTRY_ID?.trim() ?? '',
  });
}

const catalogPromises = new Map<string, Promise<DappIndexEntry[]>>();

export function resetDappCatalogCache(): void {
  catalogPromises.clear();
}

/**
 * Fixtures are additive and opt-in (`VITE_ENABLE_FIXTURE_DATA=true`). With the
 * flag unset — test and live — this is chain data only, including on the
 * failure paths below, so an unreachable registry yields an empty catalog
 * rather than fabricated listings.
 */
function finalizeCatalogEntries(entries: DappIndexEntry[]): DappIndexEntry[] {
  return applyHiddenListings(applyDevCatalogFixtures(entries));
}

async function loadCatalog(): Promise<DappIndexEntry[]> {
  if (!registryConfigured()) return finalizeCatalogEntries([]);

  try {
    return finalizeCatalogEntries(await fetchOnChainCatalogEntries());
  } catch (error) {
    console.warn('[dapp-catalog] On-chain registry read failed:', error);
    return finalizeCatalogEntries([]);
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
