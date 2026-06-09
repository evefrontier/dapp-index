/** Canonical category ids for the Dapp Index (multi-select per dapp). */
export const DAPP_INDEX_CATEGORIES = [
  {
    id: 'money',
    label: 'Money',
    subLabel: 'Risk · Finance — insurance, escrow, bounties',
  },
  {
    id: 'logistics',
    label: 'Logistics',
    subLabel: 'Trade · Commerce — jobs, hauling, trade routes, marketplaces',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    subLabel: 'Ops — gates, tolls, SSU tools, assembly managers',
  },
  {
    id: 'intel',
    label: 'Intel',
    subLabel: 'Maps · Insight — dashboards, trackers, heatmaps',
  },
  {
    id: 'coordination',
    label: 'Coordination',
    subLabel: 'Ops · Guilds — tribes, diplomacy, corp ops',
  },
  {
    id: 'build',
    label: 'Build',
    subLabel: 'Dev · Extend — low-code Move, templates, dev tooling, education',
  },
  {
    id: 'social',
    label: 'Social',
    subLabel: 'Culture · Community — medals, fan sites, community experiments',
  },
] as const;

/** Smart assembly surfaces (directory table columns; separate from categories). */
export const DAPP_INDEX_SMART_ASSEMBLY_TYPES = [
  { id: 'storage-unit', label: 'Storage unit' },
  { id: 'turret', label: 'Turret' },
  { id: 'gate', label: 'Gate' },
] as const;

export const DAPP_INDEX_METADATA_SCHEMA = 'evefrontier.dapp-index.metadata';
export const DAPP_INDEX_METADATA_SCHEMA_VERSION = 1;

export const DAPP_INDEX_SERVER_TENANTS = ['stillness', 'utopia'] as const;

export const DAPP_INDEX_SERVER_TENANT_LABELS = {
  stillness: 'Stillness',
  utopia: 'Utopia',
} as const;

export const DAPP_INDEX_SUI_NETWORKS = ['testnet', 'mainnet'] as const;

export const DAPP_INDEX_CORE_SUI_PACKAGE_ROLE = 'core';

export const DAPP_INDEX_SUI_PACKAGE_ROLES = [
  DAPP_INDEX_CORE_SUI_PACKAGE_ROLE,
  'dependency',
  'utility',
] as const;

export const DAPP_INDEX_IMAGE_MIME_TYPES = [
  'image/webp',
  'image/png',
  'image/jpeg',
] as const;

export const DAPP_INDEX_VIDEO_MIME_TYPE = 'video/webm';

export const DAPP_INDEX_MEDIA_ROLES = [
  'thumbnail',
  'hero',
  'gallery',
  'demo',
  'logo',
] as const;

/** Max bytes per listing image (registry-entry.schema.json imageAssetBase). */
export const LISTING_MEDIA_IMAGE_MAX_BYTES = 5_000_000;

/** Max bytes per listing video source (registry-entry.schema.json videoSource). */
export const LISTING_MEDIA_VIDEO_MAX_BYTES = 60_000_000;

/** Max media items in a public listing gallery. */
export const PUBLIC_MEDIA_ITEM_LIMIT = 10;

/** Public listing media budget across images, posters, and video sources. */
export const PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES = 150_000_000;

/** Maximum number of video items allowed in public listing media. */
export const PUBLIC_MEDIA_VIDEO_LIMIT = 2;

/** Official Walrus aggregator hosts (metadata JSON at `/v1/blobs/{blobId}`). */
export const WALRUS_AGGREGATOR_TESTNET_HOST =
  'aggregator.walrus-testnet.walrus.space';
export const WALRUS_AGGREGATOR_MAINNET_HOST =
  'aggregator.walrus-mainnet.walrus.space';

export const WALRUS_AGGREGATOR_TESTNET_URL = `https://${WALRUS_AGGREGATOR_TESTNET_HOST}`;
export const WALRUS_AGGREGATOR_MAINNET_URL = `https://${WALRUS_AGGREGATOR_MAINNET_HOST}`;

export const WALRUS_UPLOAD_RELAY_TESTNET_URL =
  'https://upload-relay.testnet.walrus.space';
export const WALRUS_UPLOAD_RELAY_MAINNET_URL =
  'https://upload-relay.mainnet.walrus.space';

/** Vite dev-server proxy prefixes (see `site/vite.config.ts`). */
export const WALRUS_AGGREGATOR_PROXY_TESTNET = '/walrus-aggregator-testnet';
export const WALRUS_AGGREGATOR_PROXY_MAINNET = '/walrus-aggregator-mainnet';

export const REGISTRY_SLUG_LOOKUP_RPC_TIMEOUT_MS = 8_000;
export const REGISTRY_SLUG_LOOKUP_MAX_PAGES = 50;
