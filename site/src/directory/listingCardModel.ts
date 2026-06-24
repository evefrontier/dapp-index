import { resolveListingMediaUrls } from '@/directory/resolveListingMediaUrls';
import type { DappIndexEntry } from '@/types/dapp-index';
import { getDappCategoryLabel } from '@/types/dapp-index';

export type ListingCardModel = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  categoryLabel: string;
  initial: string;
  thumbnailUrl: string | null;
  logoUrl: string | null;
};

export function getListingCardModel(entry: DappIndexEntry): ListingCardModel {
  const { thumbnailUrl, logoUrl } = resolveListingMediaUrls(entry);
  const primaryCategoryId = entry.categories[0];

  return {
    slug: entry.id,
    name: entry.name,
    summary: entry.summary,
    description:
      entry.description?.trim() || entry.summary.trim() || 'No description yet.',
    categoryLabel: primaryCategoryId
      ? getDappCategoryLabel(primaryCategoryId)
      : 'Dapp',
    initial: entry.name.slice(0, 1).toUpperCase(),
    thumbnailUrl,
    logoUrl,
  };
}
