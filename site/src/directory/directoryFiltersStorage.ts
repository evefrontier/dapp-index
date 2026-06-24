import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
} from '@/constants';
import type {
  DappIndexCategoryId,
  DappIndexSmartAssemblyType,
} from '@/types/dapp-index';

const STORAGE_KEY = 'dapp-index-directory-filters';
const VERSION = 1;

type Stored = {
  v: number;
  search: string;
  categoryFilter: string;
  smartAssemblyTypeFilter: string;
  showSmartAssemblyTypeFilters: boolean;
};

const CATEGORY_IDS = new Set<string>(
  DAPP_INDEX_CATEGORIES.map((category) => category.id),
);
const ASSEMBLY_IDS = new Set<string>(
  DAPP_INDEX_SMART_ASSEMBLY_TYPES.map((type) => type.id),
);

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

function parseCategory(
  raw: string | undefined,
): 'all' | DappIndexCategoryId {
  if (raw === 'all' || (raw !== undefined && CATEGORY_IDS.has(raw))) {
    return raw === 'all' ? 'all' : (raw as DappIndexCategoryId);
  }
  return 'all';
}

function parseAssembly(
  raw: string | undefined,
): 'all' | DappIndexSmartAssemblyType {
  if (raw === 'all' || (raw !== undefined && ASSEMBLY_IDS.has(raw))) {
    return raw === 'all' ? 'all' : (raw as DappIndexSmartAssemblyType);
  }
  return 'all';
}

export function loadDirectoryFilters(): DirectoryFilterState {
  if (typeof sessionStorage === 'undefined') {
    return defaultDirectoryFilterState;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDirectoryFilterState;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed.v !== VERSION) return defaultDirectoryFilterState;
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      categoryFilter: parseCategory(parsed.categoryFilter),
      smartAssemblyTypeFilter: parseAssembly(parsed.smartAssemblyTypeFilter),
      showSmartAssemblyTypeFilters: Boolean(parsed.showSmartAssemblyTypeFilters),
    };
  } catch {
    return defaultDirectoryFilterState;
  }
}

export function saveDirectoryFilters(state: DirectoryFilterState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const payload: Stored = {
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
