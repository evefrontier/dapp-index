import { Button, CardFilterBar } from '@evefrontier/ui';
import {
  parseSmartAssemblyFilterId,
  SMART_ASSEMBLY_FILTER_OPTIONS,
  smartAssemblyFilterToggleLabel,
} from '@/directory/directoryFilterModel';
import type { DirectoryFilterState } from '@/directory/directoryFiltersStorage';
import type { DirectoryControllerActions } from '@/directory/useDirectoryController';

type DirectorySmartAssemblyFiltersProps = {
  filters: DirectoryFilterState;
  actions: Pick<
    DirectoryControllerActions,
    'setSmartAssemblyTypeFilter' | 'toggleSmartAssemblyFilters'
  >;
};

export function DirectorySmartAssemblyFilters({
  filters,
  actions,
}: DirectorySmartAssemblyFiltersProps) {
  const { showSmartAssemblyTypeFilters, smartAssemblyTypeFilter } = filters;

  return (
    <div>
      <Button
        aria-controls={
          showSmartAssemblyTypeFilters
            ? 'dapp-index-smart-assembly-panel'
            : undefined
        }
        aria-expanded={showSmartAssemblyTypeFilters}
        size="small"
        type="button"
        variant="secondary"
        onClick={actions.toggleSmartAssemblyFilters}
      >
        {smartAssemblyFilterToggleLabel(showSmartAssemblyTypeFilters)}
      </Button>

      {showSmartAssemblyTypeFilters ? (
        <section
          aria-labelledby="dapp-index-smart-assembly-heading"
          className="mt-4"
          id="dapp-index-smart-assembly-panel"
        >
          <h2
            className="ds-type-label mb-2 text-(--color-neutral)"
            id="dapp-index-smart-assembly-heading"
          >
            Smart assembly types
          </h2>
          <CardFilterBar
            aria-label="Smart assembly types"
            options={SMART_ASSEMBLY_FILTER_OPTIONS}
            value={smartAssemblyTypeFilter}
            onChange={(nextId) => {
              const parsed = parseSmartAssemblyFilterId(nextId);
              if (parsed) {
                actions.setSmartAssemblyTypeFilter(parsed);
              }
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
