import {
  resolveDetailGallerySlides,
  resolveHeroUrl,
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
  getServerTenantLabel,
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
  heroUrl: string | null;
  logoUrl: string | null;
  categories: readonly { id: string; label: string }[];
  smartAssemblyTypes: readonly { id: string; label: string }[];
  serverTenantLabel: string;
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

export function getDappDetailViewModel(
  entry: DappIndexEntry,
): DappDetailViewModel {
  const { logoUrl } = resolveListingMediaUrls(entry);

  return {
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
    heroUrl: resolveHeroUrl(entry),
    logoUrl,
    categories: entry.categories.map((category) => ({
      id: category,
      label: getDappCategoryLabel(category),
    })),
    smartAssemblyTypes: (entry.smartAssemblyTypes ?? []).map((assembly) => ({
      id: assembly,
      label: getSmartAssemblyTypeLabel(assembly),
    })),
    serverTenantLabel: getServerTenantLabel(entry.serverTenant),
    gallerySlides: resolveDetailGallerySlides(entry),
    packages: (entry.suiPackages ?? []).map(mapPackageView),
    notes: entry.notes?.trim() || null,
  };
}
