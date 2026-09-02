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
      <div className="mb-4 flex min-w-0 flex-wrap items-baseline justify-between gap-2 border-b border-(--app-neutral-20) pb-3">
        <h2
          className="ds-type-label text-(--colors-neutral-base)"
          id="dapp-index-results-heading"
        >
          Results
        </h2>
        <p className="ds-type-caption shrink-0 text-(--colors-neutral-60)">
          Showing {entries.length} of {totalCount}
          {isFiltered ? ' (filtered)' : ''}
        </p>
      </div>

      <DappListingGrid entries={entries} />
    </section>
  );
}
