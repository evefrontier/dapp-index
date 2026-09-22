import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDappCatalog } from '@/api/catalog';
import {
  filterDirectoryEntries,
  isDirectoryFiltered,
  toggleSmartAssemblyFilterPanel,
} from '@/directory/directoryFilterModel';
import {
  type DirectoryFilterState,
  loadDirectoryFilters,
  saveDirectoryFilters,
} from '@/directory/directoryFiltersStorage';
import type {
  DappIndexCategoryId,
  DappIndexEntry,
  DappIndexSmartAssemblyType,
} from '@/types/dapp-index';

const registryQueryKey = import.meta.env.VITE_REGISTRY_ID?.trim() ?? 'off';

export type DirectoryControllerActions = {
  setSearch: (search: string) => void;
  setCategoryFilter: (categoryFilter: 'all' | DappIndexCategoryId) => void;
  setSmartAssemblyTypeFilter: (
    smartAssemblyTypeFilter: 'all' | DappIndexSmartAssemblyType,
  ) => void;
  toggleSmartAssemblyFilters: () => void;
};

type DirectoryControllerBase = {
  filters: DirectoryFilterState;
  actions: DirectoryControllerActions;
};

export type DirectoryController =
  | (DirectoryControllerBase & { status: 'loading' })
  | (DirectoryControllerBase & { status: 'error'; errorMessage: string })
  | (DirectoryControllerBase & {
      status: 'ready';
      entries: DappIndexEntry[];
      totalCount: number;
      isFiltered: boolean;
    });

function useDirectoryFilters() {
  const [filters, setFilters] = useState<DirectoryFilterState>(() =>
    loadDirectoryFilters(),
  );

  useEffect(() => {
    saveDirectoryFilters(filters);
  }, [filters]);

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }));
  }, []);

  const setCategoryFilter = useCallback(
    (categoryFilter: 'all' | DappIndexCategoryId) => {
      setFilters((current) => ({ ...current, categoryFilter }));
    },
    [],
  );

  const setSmartAssemblyTypeFilter = useCallback(
    (smartAssemblyTypeFilter: 'all' | DappIndexSmartAssemblyType) => {
      setFilters((current) => ({ ...current, smartAssemblyTypeFilter }));
    },
    [],
  );

  const toggleSmartAssemblyFilters = useCallback(() => {
    setFilters(toggleSmartAssemblyFilterPanel);
  }, []);

  const actions = useMemo(
    () => ({
      setSearch,
      setCategoryFilter,
      setSmartAssemblyTypeFilter,
      toggleSmartAssemblyFilters,
    }),
    [
      setCategoryFilter,
      setSearch,
      setSmartAssemblyTypeFilter,
      toggleSmartAssemblyFilters,
    ],
  );

  return { filters, actions };
}

export function useDirectoryController(): DirectoryController {
  const { filters, actions } = useDirectoryFilters();
  const catalogQuery = useQuery({
    queryKey: ['dapp-catalog', registryQueryKey],
    queryFn: fetchDappCatalog,
  });

  const filteredEntries = useMemo(
    () =>
      catalogQuery.data ? filterDirectoryEntries(catalogQuery.data, filters) : [],
    [catalogQuery.data, filters],
  );

  if (catalogQuery.isPending) {
    return { status: 'loading', filters, actions };
  }

  if (catalogQuery.isError) {
    return {
      status: 'error',
      errorMessage: String(catalogQuery.error),
      filters,
      actions,
    };
  }

  return {
    status: 'ready',
    filters,
    actions,
    entries: filteredEntries,
    totalCount: catalogQuery.data.length,
    isFiltered: isDirectoryFiltered(filters),
  };
}
