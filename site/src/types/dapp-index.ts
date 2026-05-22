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

export type DappIndexCategoryId =
  (typeof DAPP_INDEX_CATEGORIES)[number]['id'];

/** Smart assembly surfaces (directory table columns; separate from categories). */
export const DAPP_INDEX_SMART_ASSEMBLY_TYPES = [
  { id: 'storage-unit', label: 'Storage unit' },
  { id: 'turret', label: 'Turret' },
  { id: 'gate', label: 'Gate' },
] as const;

export type DappIndexSmartAssemblyType =
  (typeof DAPP_INDEX_SMART_ASSEMBLY_TYPES)[number]['id'];

/**
 * EVE Frontier **game server tenant** where this dapp is aimed or deployed
 * (e.g. Stillness / Utopia). Not Sui chain (devnet / testnet / mainnet)—use
 * `suiPackages` and wallet tooling for chain targeting.
 */
export type DappIndexServerTenant = 'stillness' | 'utopia';

export const DAPP_INDEX_METADATA_SCHEMA = 'evefrontier.dapp-index.metadata';
export const DAPP_INDEX_METADATA_SCHEMA_VERSION = 1;

export type DappIndexMetadataSchema = typeof DAPP_INDEX_METADATA_SCHEMA;
export type DappIndexMetadataSchemaVersion =
  typeof DAPP_INDEX_METADATA_SCHEMA_VERSION;

export type DappIndexSuiNetwork = 'testnet' | 'mainnet';

export interface DappIndexMaintainer {
  name: string;
  url?: string;
  contact?: string;
}

export type DappIndexImageMimeType =
  | 'image/webp'
  | 'image/png'
  | 'image/jpeg';

export type DappIndexVideoMimeType = 'video/webm';

export type DappIndexMediaRole =
  | 'thumbnail'
  | 'hero'
  | 'gallery'
  | 'demo'
  | 'logo';

export interface DappIndexImageAsset {
  uri: `walrus://blob/${string}`;
  mimeType: DappIndexImageMimeType;
  sha256: string;
  sizeBytes: number;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

export interface DappIndexImageMediaItem extends DappIndexImageAsset {
  id: string;
  kind: 'image';
  role: DappIndexMediaRole;
}

export interface DappIndexVideoSource {
  uri: `walrus://blob/${string}`;
  mimeType: DappIndexVideoMimeType;
  codecs?: string;
  sha256: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSeconds: number;
}

export interface DappIndexVideoMediaItem {
  id: string;
  kind: 'video';
  role: DappIndexMediaRole;
  poster: DappIndexImageAsset;
  sources: DappIndexVideoSource[];
  caption?: string;
}

export type DappIndexMediaItem =
  | DappIndexImageMediaItem
  | DappIndexVideoMediaItem;

export interface DappIndexMediaGallery {
  thumbnail?: string;
  hero?: string;
  items: DappIndexMediaItem[];
}

export type DappIndexSuiPackageRole = 'core' | 'dependency' | 'utility';

export interface DappIndexSuiPackage {
  network: DappIndexSuiNetwork;
  role: DappIndexSuiPackageRole;
  /** Canonical Move Registry name, e.g. `@studio/game`. */
  mvrName: string;
  /** Published Move package object ID resolved by MVR. */
  packageId: string;
  /** MVR PackageInfo object ID for this package on `network`. */
  packageInfoId: string;
  /** Move modules surfaced by this dapp package. */
  modules?: string[];
  explorerUrl?: string;
}

/** Sui testnet package page on Suivision (explorer). */
export function suivisionTestnetPackageUrl(packageId: string): string {
  const id = packageId.trim().toLowerCase();
  return `https://testnet.suivision.xyz/package/${id}`;
}

/** One discoverable Frontier ecosystem dapp / tool. */
export interface DappIndexEntry {
  schema: DappIndexMetadataSchema;
  schemaVersion: DappIndexMetadataSchemaVersion;
  /** URL slug for /explore/:id */
  id: string;
  name: string;
  summary: string;
  description?: string;
  /** Search & filter; dapps can appear under multiple categories. */
  categories: DappIndexCategoryId[];
  /**
   * Smart assembly types for this entry (shown as one comma-separated column in the directory).
   * Omitted or empty → em dash in the table.
   */
  smartAssemblyTypes?: DappIndexSmartAssemblyType[];
  /** Public demo or production site. Public listings require HTTPS. */
  liveUrl: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  /** Structured package metadata for each supported Sui network. */
  suiPackages?: DappIndexSuiPackage[];
  /** Published Move package object IDs when known. */
  packageIds?: string[];
  /** Move Registry verified Sui packages required before public release. */
  suiPackages: DappIndexSuiPackage[];
  /** Walrus / metadata URI recorded in the on-chain registry. */
  metadataUri?: string;
  /** Hex-encoded SHA-256 metadata hash recorded in the on-chain registry. */
  metadataHash?: string;
  /** Owner address recorded in the on-chain registry. */
  registryOwner?: string;
  /** Frontier server tenant; not Sui devnet/testnet/mainnet. */
  serverTenant: DappIndexServerTenant;
  maintainer?: DappIndexMaintainer;
  /** Walrus-hosted public gallery for cards, detail pages, and video demos. */
  media?: DappIndexMediaGallery;
  /** Ownership and domain proof records. */
  proofs?: {
    domain?: {
      url: string;
    };
  };
  /** Extra context (dependencies, testnet-only, etc.). */
  notes?: string;
}

export function getDappCategoryRow(
  id: DappIndexCategoryId,
): (typeof DAPP_INDEX_CATEGORIES)[number] | undefined {
  return DAPP_INDEX_CATEGORIES.find((c) => c.id === id);
}

/** Primary one-word title shown in directory UI. */
export function getDappCategoryLabel(id: DappIndexCategoryId): string {
  return getDappCategoryRow(id)?.label ?? id;
}

/** Alternatives and examples (muted line under the title). */
export function getDappCategorySubLabel(id: DappIndexCategoryId): string {
  return getDappCategoryRow(id)?.subLabel ?? '';
}

/** Label + subLabel for search / filter token matching. */
export function getDappCategorySearchText(id: DappIndexCategoryId): string {
  const row = getDappCategoryRow(id);
  if (!row) return id;
  return `${row.label} ${row.subLabel}`;
}

export function getSmartAssemblyTypeLabel(
  id: DappIndexSmartAssemblyType,
): string {
  const row = DAPP_INDEX_SMART_ASSEMBLY_TYPES.find((s) => s.id === id);
  return row?.label ?? id;
}

const SERVER_TENANT_LABELS: Record<DappIndexServerTenant, string> = {
  stillness: 'Stillness',
  utopia: 'Utopia',
};

/** Human label for directory / detail UI. */
export function getServerTenantLabel(
  id: DappIndexServerTenant | string | undefined,
): string {
  if (id === undefined || id === '') return '';
  return SERVER_TENANT_LABELS[id as DappIndexServerTenant] ?? String(id);
}
