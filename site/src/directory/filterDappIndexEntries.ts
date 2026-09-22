import type {
  DappIndexCategoryId,
  DappIndexEntry,
  DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import {
  getDappCategorySearchText,
  getServerTenantLabel,
  getSmartAssemblyTypeLabel,
} from '@/types/dapp-index';

function entrySearchHaystack(entry: DappIndexEntry): string {
  const raw: (string | undefined)[] = [
    entry.id,
    entry.name,
    entry.summary,
    entry.description,
    entry.notes,
    entry.liveUrl,
    entry.repositoryUrl,
    entry.documentationUrl,
    entry.serverTenant,
    getServerTenantLabel(entry.serverTenant),
    ...(entry.suiPackages ?? []).flatMap((pkg) => [
      pkg.mvrName,
      pkg.packageId,
      pkg.packageInfoId,
    ]),
    ...entry.categories.flatMap((category) => [
      category,
      getDappCategorySearchText(category),
    ]),
    ...(entry.smartAssemblyTypes ?? []).flatMap((type) => [
      type,
      getSmartAssemblyTypeLabel(type),
    ]),
  ];

  return raw
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join('\n')
    .toLowerCase();
}

export function filterDappIndexEntries(
  entries: readonly DappIndexEntry[],
  rawQuery: string,
  smartAssemblyTypes?: readonly DappIndexSmartAssemblyType[],
  categoryId?: DappIndexCategoryId,
): DappIndexEntry[] {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return entries.filter((entry) => {
    if (categoryId && !entry.categories.includes(categoryId)) {
      return false;
    }

    if (smartAssemblyTypes && smartAssemblyTypes.length > 0) {
      const types = entry.smartAssemblyTypes ?? [];
      if (!smartAssemblyTypes.some((id) => types.includes(id))) {
        return false;
      }
    }

    if (tokens.length === 0) return true;

    const haystack = entrySearchHaystack(entry);
    return tokens.every((token) => haystack.includes(token));
  });
}
