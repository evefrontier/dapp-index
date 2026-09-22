import {
  imageMediaItemReadUrl,
  resolveWalrusBlobReadUrl,
} from '@/directory/resolveWalrusMediaUrl';
import type {
  DappIndexEntry,
  DappIndexMediaRole,
} from '@/types/dapp-index';

const DETAIL_GALLERY_ROLES = new Set<DappIndexMediaRole>(['gallery', 'demo']);

export type DappDetailGallerySlide =
  | {
      kind: 'image';
      id: string;
      url: string;
      alt: string;
      caption: string | null;
    }
  | {
      kind: 'video';
      id: string;
      posterUrl: string | null;
      sourceUrl: string;
      caption: string | null;
    };

export function resolveDetailGallerySlides(
  entry: DappIndexEntry,
): DappDetailGallerySlide[] {
  const items = entry.media?.items ?? [];
  const slides: DappDetailGallerySlide[] = [];

  for (const item of items) {
    if (!DETAIL_GALLERY_ROLES.has(item.role)) continue;

    if (item.kind === 'image') {
      const url = imageMediaItemReadUrl(item);
      if (!url) continue;
      slides.push({
        kind: 'image',
        id: item.id,
        url,
        alt: item.alt,
        caption: item.caption?.trim() || null,
      });
      continue;
    }

    const source = item.sources[0];
    const sourceUrl = source ? resolveWalrusBlobReadUrl(source.uri) : null;
    if (!sourceUrl) continue;

    slides.push({
      kind: 'video',
      id: item.id,
      posterUrl: resolveWalrusBlobReadUrl(item.poster.uri),
      sourceUrl,
      caption: item.caption?.trim() || null,
    });
  }

  return slides;
}
