import { Link } from '@tanstack/react-router';
import { TagPill } from '@evefrontier/component-library';
import { getListingCardModel } from '@/directory/listingCardModel';
import type { ListingCardModel } from '@/directory/listingCardModel';
import type { DappIndexEntry } from '@/types/dapp-index';

function ListingCardMedia({ model }: { model: ListingCardModel }) {
  return (
    <div className="directory-card-media">
      {model.thumbnailUrl ? (
        <img
          alt=""
          className="directory-card-thumbnail"
          loading="lazy"
          src={model.thumbnailUrl}
        />
      ) : (
        <div aria-hidden="true" className="directory-card-thumbnail-fallback">
          {model.initial}
        </div>
      )}

      {model.logoUrl ? (
        <img
          alt=""
          className="directory-card-logo"
          loading="lazy"
          src={model.logoUrl}
        />
      ) : (
        <div aria-hidden="true" className="directory-card-logo-fallback">
          {model.initial}
        </div>
      )}
    </div>
  );
}

function ListingCardBody({ model }: { model: ListingCardModel }) {
  return (
    <div className="directory-card-body">
      <div className="directory-card-heading">
        <h2 className="directory-card-title">{model.name}</h2>
        <TagPill size="small" text={model.categoryLabel} variation="secondary" />
      </div>
      <p className="directory-card-summary">{model.summary}</p>
    </div>
  );
}

function ListingCardHover({ model }: { model: ListingCardModel }) {
  return (
    <div aria-hidden="true" className="directory-card-hover">
      <p className="directory-card-hover-label">About</p>
      <p className="directory-card-hover-copy">{model.description}</p>
      <span className="directory-card-hover-cta">View listing →</span>
    </div>
  );
}

export function DappListingCard({ entry }: { entry: DappIndexEntry }) {
  const model = getListingCardModel(entry);

  return (
    <article className="directory-card group">
      <Link
        to="/dapps/$slug"
        params={{ slug: model.slug }}
        className="directory-card-link"
      >
        <ListingCardMedia model={model} />
        <ListingCardBody model={model} />
        <ListingCardHover model={model} />
      </Link>
    </article>
  );
}

export function DappListingGrid({
  entries,
}: {
  entries: readonly DappIndexEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-(--colors-neutral-60)">
        No listings match the current filters.
      </p>
    );
  }

  return (
    <div className="directory-grid">
      {entries.map((entry) => (
        <DappListingCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
