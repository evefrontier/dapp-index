import { DirectoryCategoryNav } from '@/components/directory/DirectoryCategoryNav';
import { DirectoryResultsSection } from '@/components/directory/DirectoryResultsSection';
import { DirectorySearchField } from '@/components/directory/DirectorySearchField';
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
  const { filters, entries, totalCount, isFiltered } = controller;

  return (
    <div className="min-w-0 space-y-8">
      <div className="directory-toolbar">
        <DirectorySearchField
          value={filters.search}
          onChange={controller.actions.setSearch}
        />
        <DirectoryCategoryNav
          categoryFilter={filters.categoryFilter}
          onCategoryFilterChange={controller.actions.setCategoryFilter}
        />
      </div>
      <DirectoryResultsSection
        entries={entries}
        totalCount={totalCount}
        isFiltered={isFiltered}
      />
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
