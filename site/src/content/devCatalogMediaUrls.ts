/**
 * TEMPORARY local dev media map. Delete this file with devCatalogFixtures.ts
 * and site/public/dev-catalog/ before shipping.
 */

const DEV_CATALOG_MEDIA_URLS = {
  'dev-frontier-hero': '/dev-catalog/eve-frontier-dashboard.png',
  'dev-frontier-logo': '/dev-catalog/eve-frontier-dashboard.png',
  'dev-frontier-gallery-1': '/dev-catalog/eve-frontier-dashboard.png',
  'dev-frontier-gallery-2': '/dev-catalog/monkey-show-detail.png',
  'dev-monkey-hero': '/dev-catalog/eve-frontier-dashboard.png',
  'dev-monkey-logo': '/dev-catalog/eve-frontier-dashboard.png',
  'dev-monkey-gallery-1': '/dev-catalog/monkey-show-detail.png',
  'dev-monkey-poster': '/dev-catalog/eve-frontier-dashboard.png',
  'dev-monkey-demo':
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
} as const satisfies Record<string, string>;

export function resolveDevCatalogMediaUrl(blobId: string): string | null {
  if (!import.meta.env.DEV) return null;
  return DEV_CATALOG_MEDIA_URLS[blobId as keyof typeof DEV_CATALOG_MEDIA_URLS] ?? null;
}
