import { DirectoryCategoryNav } from '@/components/directory/DirectoryCategoryNav';
import { DirectoryPageHeader } from '@/components/directory/DirectoryPageHeader';
import { DirectoryResultsSection } from '@/components/directory/DirectoryResultsSection';
import { DirectorySearchField } from '@/components/directory/DirectorySearchField';
import { DirectorySmartAssemblyFilters } from '@/components/directory/DirectorySmartAssemblyFilters';
import { DirectoryStatusMessage } from '@/components/directory/DirectoryStatusMessage';
import { useDirectoryController } from '@/directory/useDirectoryController';

function DirectoryReadyView({
  controller,
}: {
  controller: Extract<
    ReturnType<typeof useDirectoryController>,
    { status: 'ready' }
  >;
}) {
  const { filters, actions, entries, totalCount, isFiltered } = controller;

  return (
    <div className="min-w-0 space-y-8">
      <DirectoryPageHeader />
      <DirectorySearchField
        value={filters.search}
        onChange={actions.setSearch}
      />
      <DirectorySmartAssemblyFilters filters={filters} actions={actions} />
      <section className="min-w-0">
        <DirectoryCategoryNav
          categoryFilter={filters.categoryFilter}
          onCategoryFilterChange={actions.setCategoryFilter}
        />
        <DirectoryResultsSection
          entries={entries}
          totalCount={totalCount}
          isFiltered={isFiltered}
        />
      </section>
    </div>
  );
}

export function DappDirectoryPage() {
  const controller = useDirectoryController();

  if (controller.status === 'loading') {
    return <DirectoryStatusMessage tone="loading" />;
  }

  if (controller.status === 'error') {
    return (
      <DirectoryStatusMessage
        tone="error"
        message={controller.errorMessage}
      />
    );
  }

  return <DirectoryReadyView controller={controller} />;
}
