import type { DirectoryFilterState } from '@/directory/directoryFiltersStorage';
import type {
  DappIndexCategoryId,
  DappIndexEntry,
  DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import { filterDappIndexEntries } from '@/directory/filterDappIndexEntries';

export function isDirectoryFiltered(filters: DirectoryFilterState): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.categoryFilter !== 'all' ||
    (filters.showSmartAssemblyTypeFilters &&
      filters.smartAssemblyTypeFilter !== 'all')
  );
}

export function getActiveSmartAssemblyTypes(
  filters: DirectoryFilterState,
): readonly DappIndexSmartAssemblyType[] | undefined {
  if (
    !filters.showSmartAssemblyTypeFilters ||
    filters.smartAssemblyTypeFilter === 'all'
  ) {
    return undefined;
  }
  return [filters.smartAssemblyTypeFilter];
}

export function getActiveCategoryFilter(
  filters: DirectoryFilterState,
): DappIndexCategoryId | undefined {
  return filters.categoryFilter === 'all' ? undefined : filters.categoryFilter;
}

export function filterDirectoryEntries(
  entries: readonly DappIndexEntry[],
  filters: DirectoryFilterState,
): DappIndexEntry[] {
  return filterDappIndexEntries(
    entries,
    filters.search,
    getActiveSmartAssemblyTypes(filters),
    getActiveCategoryFilter(filters),
  );
}

export function toggleSmartAssemblyFilterPanel(
  filters: DirectoryFilterState,
): DirectoryFilterState {
  if (filters.showSmartAssemblyTypeFilters) {
    return {
      ...filters,
      showSmartAssemblyTypeFilters: false,
      smartAssemblyTypeFilter: 'all',
    };
  }
  return { ...filters, showSmartAssemblyTypeFilters: true };
}
