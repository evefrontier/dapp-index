import { z } from 'zod';
import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
} from '@/constants';
import { storedEnumValue, storedString } from '@/schemas/shared';
import type {
  DappIndexCategoryId,
  DappIndexSmartAssemblyType,
} from '@/types/dapp-index';

const STORAGE_KEY = 'dapp-index-directory-filters';
const VERSION = 1;

const CATEGORY_FILTER_VALUES = [
  'all',
  ...DAPP_INDEX_CATEGORIES.map((category) => category.id),
] as ['all', DappIndexCategoryId, ...DappIndexCategoryId[]];

const ASSEMBLY_FILTER_VALUES = [
  'all',
  ...DAPP_INDEX_SMART_ASSEMBLY_TYPES.map((type) => type.id),
] as ['all', DappIndexSmartAssemblyType, ...DappIndexSmartAssemblyType[]];

const StoredFiltersSchema = z.object({
  v: z.literal(VERSION),
  search: storedString(),
  categoryFilter: storedEnumValue(CATEGORY_FILTER_VALUES, 'all'),
  smartAssemblyTypeFilter: storedEnumValue(ASSEMBLY_FILTER_VALUES, 'all'),
  showSmartAssemblyTypeFilters: z.coerce.boolean(),
});

type StoredFilters = z.infer<typeof StoredFiltersSchema>;

export type DirectoryFilterState = {
  search: string;
  categoryFilter: 'all' | DappIndexCategoryId;
  smartAssemblyTypeFilter: 'all' | DappIndexSmartAssemblyType;
  showSmartAssemblyTypeFilters: boolean;
};

export const defaultDirectoryFilterState: DirectoryFilterState = {
  search: '',
  categoryFilter: 'all',
  smartAssemblyTypeFilter: 'all',
  showSmartAssemblyTypeFilters: false,
};

export function loadDirectoryFilters(): DirectoryFilterState {
  if (typeof sessionStorage === 'undefined') {
    return defaultDirectoryFilterState;
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultDirectoryFilterState;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return defaultDirectoryFilterState;
  }

  const result = StoredFiltersSchema.safeParse(json);
  if (!result.success) return defaultDirectoryFilterState;

  return {
    search: result.data.search,
    categoryFilter: result.data.categoryFilter,
    smartAssemblyTypeFilter: result.data.smartAssemblyTypeFilter,
    showSmartAssemblyTypeFilters: result.data.showSmartAssemblyTypeFilters,
  };
}

export function saveDirectoryFilters(state: DirectoryFilterState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const payload: StoredFilters = {
      v: VERSION,
      search: state.search,
      categoryFilter: state.categoryFilter,
      smartAssemblyTypeFilter: state.smartAssemblyTypeFilter,
      showSmartAssemblyTypeFilters: state.showSmartAssemblyTypeFilters,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode.
  }
}
