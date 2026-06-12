import {
  findMediaItemById,
  firstImageReadUrlByRole,
  imageMediaItemReadUrl,
} from '@/directory/resolveWalrusMediaUrl';
import type { DappIndexEntry, DappIndexImageMediaItem } from '@/types/dapp-index';

export type ListingMediaUrls = {
  thumbnailUrl: string | null;
  logoUrl: string | null;
};

export function resolveListingMediaUrls(
  entry: DappIndexEntry,
): ListingMediaUrls {
  const thumbnailItem = findMediaItemById(entry, entry.media?.thumbnail);
  const heroItem = findMediaItemById(entry, entry.media?.hero);
  const firstImage = entry.media?.items.find((item) => item.kind === 'image');
  const thumbnailUrl =
    imageMediaItemReadUrl(thumbnailItem as DappIndexImageMediaItem | undefined) ??
    imageMediaItemReadUrl(heroItem as DappIndexImageMediaItem | undefined) ??
    firstImageReadUrlByRole(entry, 'gallery') ??
    imageMediaItemReadUrl(firstImage as DappIndexImageMediaItem | undefined);

  const logoUrl =
    firstImageReadUrlByRole(entry, 'logo') ??
    firstImageReadUrlByRole(entry, 'thumbnail') ??
    thumbnailUrl;

  return { thumbnailUrl, logoUrl };
}
