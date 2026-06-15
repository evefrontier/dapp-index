import { Button } from '@evefrontier/ui';
import { DAPP_INDEX_CATEGORIES } from '@/constants';
import type { DirectoryFilterState } from '@/directory/directoryFiltersStorage';
import type { DirectoryControllerActions } from '@/directory/useDirectoryController';
import type { DappIndexCategoryId } from '@/types/dapp-index';

type DirectoryCategoryNavProps = {
  categoryFilter: DirectoryFilterState['categoryFilter'];
  onCategoryFilterChange: DirectoryControllerActions['setCategoryFilter'];
};

export function DirectoryCategoryNav({
  categoryFilter,
  onCategoryFilterChange,
}: DirectoryCategoryNavProps) {
  return (
    <nav
      aria-label="Filter by category"
      className="directory-toolbar-filters min-w-0"
    >
      <ul className="m-0 flex list-none flex-row flex-wrap gap-2 p-0">
        <li className="shrink-0">
          <Button
            size="small"
            type="button"
            variant={categoryFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => onCategoryFilterChange('all')}
          >
            All
          </Button>
        </li>
        {DAPP_INDEX_CATEGORIES.map((category) => (
          <li key={category.id} className="shrink-0">
            <Button
              size="small"
              type="button"
              variant={
                categoryFilter === category.id ? 'primary' : 'secondary'
              }
              onClick={() =>
                onCategoryFilterChange(category.id as DappIndexCategoryId)
              }
            >
              {category.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
