import { DAPP_INDEX_CORE_SUI_PACKAGE_ROLE } from '@/constants';
import {
  resolveDetailGallerySlides,
  type DappDetailGallerySlide,
} from '@/directory/resolveDetailMedia';
import { resolveListingMediaUrls } from '@/directory/resolveListingMediaUrls';
import { resolveWalrusMetadataReadUrl } from '@/directory/resolveWalrusMediaUrl';
import type {
  DappIndexEntry,
  DappIndexSuiPackage,
} from '@/types/dapp-index';
import {
  getDappCategoryLabel,
  getSmartAssemblyTypeLabel,
  suivisionTestnetPackageUrl,
} from '@/types/dapp-index';

export type DappDetailPackageView = {
  network: string;
  role: string;
  packageId: string;
  mvrName: string | null;
  packageInfoId: string | null;
  explorerUrl: string | null;
};

export type DappDetailViewModel = {
  name: string;
  summary: string;
  description: string | null;
  liveUrl: string;
  repositoryUrl: string | null;
  documentationUrl: string | null;
  metadataUri: string | null;
  metadataReadUrl: string | null;
  logoUrl: string | null;
  categories: readonly { id: string; label: string }[];
  smartAssemblyTypes: readonly { id: string; label: string }[];
  /** Breadcrumb trail: smart assembly type, then category. */
  breadcrumbSegments: readonly string[];
  /** Team/corporation the builder submitted on behalf of. */
  tribeLabel: string | null;
  /** Individual Rider (solo-builder) display name. */
  riderLabel: string | null;
  /** Sui network(s) of the entry's packages, e.g. `Testnet`. */
  networkLabel: string | null;
  /** Category / assembly labels not already shown in the breadcrumb. */
  tagLabels: readonly string[];
  gallerySlides: DappDetailGallerySlide[];
  packages: DappDetailPackageView[];
  notes: string | null;
};

function mapPackageView(pkg: DappIndexSuiPackage): DappDetailPackageView {
  const explorerUrl =
    pkg.explorerUrl?.trim() ||
    (pkg.network === 'testnet'
      ? suivisionTestnetPackageUrl(pkg.packageId)
      : null);

  return {
    network: pkg.network,
    role: pkg.role,
    packageId: pkg.packageId,
    mvrName: pkg.mvrName?.trim() || null,
    packageInfoId: pkg.packageInfoId?.trim() || null,
    explorerUrl,
  };
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Sui network of the core package, or every distinct network when there is no core. */
function resolveNetworkLabel(
  packages: readonly DappIndexSuiPackage[],
): string | null {
  if (packages.length === 0) return null;

  const core = packages.find(
    (pkg) => pkg.role === DAPP_INDEX_CORE_SUI_PACKAGE_ROLE,
  );
  if (core) return titleCase(core.network);

  const networks = [...new Set(packages.map((pkg) => pkg.network))];
  return networks.map(titleCase).join(' · ');
}

export function getDappDetailViewModel(
  entry: DappIndexEntry,
): DappDetailViewModel {
  const { logoUrl } = resolveListingMediaUrls(entry);

  const categories = entry.categories.map((category) => ({
    id: category,
    label: getDappCategoryLabel(category),
  }));
  const smartAssemblyTypes = (entry.smartAssemblyTypes ?? []).map((assembly) => ({
    id: assembly,
    label: getSmartAssemblyTypeLabel(assembly),
  }));

  // Breadcrumb takes the leading assembly type and category; the tag row shows the rest.
  const breadcrumbSegments = [
    smartAssemblyTypes[0]?.label,
    categories[0]?.label,
  ].filter((label): label is string => Boolean(label));
  const tagLabels = [...smartAssemblyTypes, ...categories]
    .map((item) => item.label)
    .filter((label) => !breadcrumbSegments.includes(label));

  return {
    breadcrumbSegments,
    tribeLabel: entry.tribe?.trim() || null,
    riderLabel: entry.riderName?.trim() || null,
    networkLabel: resolveNetworkLabel(entry.suiPackages ?? []),
    tagLabels,
    name: entry.name,
    summary: entry.summary,
    description: entry.description?.trim() || null,
    liveUrl: entry.liveUrl,
    repositoryUrl: entry.repositoryUrl?.trim() || null,
    documentationUrl: entry.documentationUrl?.trim() || null,
    metadataUri: entry.metadataUri ?? null,
    metadataReadUrl: entry.metadataUri
      ? resolveWalrusMetadataReadUrl(entry.metadataUri)
      : null,
    logoUrl,
    categories,
    smartAssemblyTypes,
    gallerySlides: resolveDetailGallerySlides(entry),
    packages: (entry.suiPackages ?? []).map(mapPackageView),
    notes: entry.notes?.trim() || null,
  };
}
