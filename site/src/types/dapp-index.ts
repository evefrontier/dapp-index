import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_MEDIA_ROLES,
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SERVER_TENANT_LABELS,
  DAPP_INDEX_SUI_NETWORKS,
  DAPP_INDEX_SUI_PACKAGE_ROLES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/constants';

export {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_MEDIA_ROLES,
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SERVER_TENANT_LABELS,
  DAPP_INDEX_SUI_NETWORKS,
  DAPP_INDEX_SUI_PACKAGE_ROLES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/constants';

export type DappIndexCategoryId =
  (typeof DAPP_INDEX_CATEGORIES)[number]['id'];

export type DappIndexSmartAssemblyType =
  (typeof DAPP_INDEX_SMART_ASSEMBLY_TYPES)[number]['id'];

/**
 * EVE Frontier **game server tenant** where this dapp is aimed or deployed
 * (e.g. Stillness / Utopia). Not Sui chain (devnet / testnet / mainnet)—use
 * `suiPackages` and wallet tooling for chain targeting.
 */
export type DappIndexServerTenant =
  (typeof DAPP_INDEX_SERVER_TENANTS)[number];

export type DappIndexMetadataSchema = typeof DAPP_INDEX_METADATA_SCHEMA;
export type DappIndexMetadataSchemaVersion =
  typeof DAPP_INDEX_METADATA_SCHEMA_VERSION;

export type DappIndexSuiNetwork = (typeof DAPP_INDEX_SUI_NETWORKS)[number];

export type DappIndexSuiPackageRole =
  (typeof DAPP_INDEX_SUI_PACKAGE_ROLES)[number];

export type DappIndexImageMimeType =
  (typeof DAPP_INDEX_IMAGE_MIME_TYPES)[number];

export type DappIndexVideoMimeType = typeof DAPP_INDEX_VIDEO_MIME_TYPE;

export type DappIndexMediaRole =
  (typeof DAPP_INDEX_MEDIA_ROLES)[number];

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

/** Human label for directory / detail UI. */
export function getServerTenantLabel(
  id: DappIndexServerTenant | string | undefined,
): string {
  if (id === undefined || id === '') return '';
  return DAPP_INDEX_SERVER_TENANT_LABELS[id as DappIndexServerTenant] ?? String(id);
}
