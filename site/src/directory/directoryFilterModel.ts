import type { CardFilterOption } from '@evefrontier/ui';
import type { DirectoryFilterState } from '@/directory/directoryFiltersStorage';
import type {
  DappIndexCategoryId,
  DappIndexEntry,
  DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import { filterDappIndexEntries } from '@/directory/filterDappIndexEntries';

export const SMART_ASSEMBLY_FILTER_OPTIONS = [
  { id: 'storage-unit', label: 'Storage' },
  { id: 'turret', label: 'Turret' },
  { id: 'gate', label: 'Gate' },
] as const satisfies readonly CardFilterOption[];

const SMART_ASSEMBLY_FILTER_IDS = new Set<string>(
  SMART_ASSEMBLY_FILTER_OPTIONS.map((option) => option.id),
);

export function parseSmartAssemblyFilterId(
  value: string,
): 'all' | DappIndexSmartAssemblyType | null {
  if (value === 'all') return 'all';
  if (SMART_ASSEMBLY_FILTER_IDS.has(value)) {
    return value as DappIndexSmartAssemblyType;
  }
  return null;
}

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

export function smartAssemblyFilterToggleLabel(
  showSmartAssemblyTypeFilters: boolean,
): string {
  return showSmartAssemblyTypeFilters
    ? 'Hide smart assembly type filter'
    : 'Show smart assembly type filter';
}
