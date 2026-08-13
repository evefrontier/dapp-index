import type { DappIndexEntry } from '@/types/dapp-index';
import { DappListingGrid } from '@/components/directory/DappListingCard';

type DirectoryResultsSectionProps = {
  entries: readonly DappIndexEntry[];
  totalCount: number;
  isFiltered: boolean;
};

export function DirectoryResultsSection({
  entries,
  totalCount,
  isFiltered,
}: DirectoryResultsSectionProps) {
  return (
    <section aria-labelledby="dapp-index-results-heading">
      <div className="mb-6 flex min-w-0 flex-wrap items-baseline justify-between gap-3">
        <h2
          className="ds-type-label text-(--color-neutral)"
          id="dapp-index-results-heading"
        >
          {entries.length === 0 ? 'No results' : 'Results'}
        </h2>
        <p className="ds-type-caption shrink-0 text-(--color-neutral-60)">
          Showing {entries.length} of {totalCount}
          {isFiltered ? ' (filtered)' : ''}
        </p>
      </div>

      <DappListingGrid entries={entries} />
    </section>
  );
}
