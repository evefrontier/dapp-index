import { normalizeSuiObjectId } from '@mysten/sui/utils';
import type {
  DappIndexSuiNetwork,
  DappIndexSuiPackageRole,
} from '../types/dapp-index';

export const MVR_NAME_PATTERN_SOURCE =
  '(@[a-z0-9][a-z0-9-]*|[a-z0-9][a-z0-9-]*\\.sui)/[a-z0-9][a-z0-9_-]*(?:/[1-9][0-9]*)?';
export const MVR_NAME_PATTERN = new RegExp(`^${MVR_NAME_PATTERN_SOURCE}$`);
const SUI_OBJECT_ID_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export type MoveRegistryResolvablePackage = {
  network: DappIndexSuiNetwork;
  role: DappIndexSuiPackageRole;
  mvrName?: string;
  packageId?: string;
  packageInfoId?: string;
};

export type MoveRegistryPackageResolver = {
  resolvePackage(options: {
    package: string;
    network: DappIndexSuiNetwork;
  }): Promise<{
    package: string;
    packageInfoId?: string;
    network?: DappIndexSuiNetwork;
  }>;
};

export type MoveRegistryResolver = {
  core?: { mvr?: MoveRegistryPackageResolver };
  mvr?: MoveRegistryPackageResolver;
};

export type MoveRegistryVerificationStatus =
  | 'verified'
  | 'mismatch'
  | 'missing'
  | 'unreachable';

export type MoveRegistryVerificationResult = {
  status: MoveRegistryVerificationStatus;
  entry: MoveRegistryResolvablePackage;
  network?: DappIndexSuiNetwork;
  mvrName?: string;
  packageId?: string;
  packageInfoId?: string;
  resolvedPackageId?: string;
  resolvedPackageInfoId?: string;
  resolvedNetwork?: DappIndexSuiNetwork;
  reason?: string;
  errorMessage?: string;
};

export type MoveRegistryReleaseVerification =
  | {
      ok: true;
      results: MoveRegistryVerificationResult[];
    }
  | {
      ok: false;
      reason: 'missing-core-package' | 'verification-failed';
      results: MoveRegistryVerificationResult[];
    };

export function isValidMvrName(value: string): boolean {
  return MVR_NAME_PATTERN.test(value.trim());
}

export async function verifyMoveRegistryPackage(
  entry: MoveRegistryResolvablePackage,
  resolver: MoveRegistryResolver,
): Promise<MoveRegistryVerificationResult> {
  const network = entry.network;
  const mvrName = entry.mvrName?.trim();
  const packageId = normalizePackageId(entry.packageId);
  const packageInfoId = normalizePackageId(entry.packageInfoId);

  if (!isSuiNetwork(network)) {
    return { status: 'missing', entry, reason: 'invalid-network' };
  }

  if (!mvrName) {
    return { status: 'missing', entry, network, reason: 'missing-mvr-name' };
  }

  if (!isValidMvrName(mvrName)) {
    return { status: 'missing', entry, network, mvrName, reason: 'invalid-mvr-name' };
  }

  if (!packageId) {
    return { status: 'missing', entry, network, mvrName, reason: 'missing-package-id' };
  }

  if (!packageInfoId) {
    return {
      status: 'missing',
      entry,
      network,
      mvrName,
      packageId,
      reason: 'missing-package-info-id',
    };
  }

  const packageResolver = resolver.core?.mvr ?? resolver.mvr;
  if (!packageResolver) {
    return {
      status: 'unreachable',
      entry,
      network,
      mvrName,
      packageId,
      packageInfoId,
      errorMessage: 'MVR resolver is unavailable',
    };
  }

  try {
    const resolved = await packageResolver.resolvePackage({ package: mvrName, network });
    const resolvedPackageId = normalizePackageId(resolved.package);
    const resolvedPackageInfoId = normalizePackageId(resolved.packageInfoId);

    if (!resolvedPackageId) {
      return {
        status: 'unreachable',
        entry,
        network,
        mvrName,
        packageId,
        packageInfoId,
        reason: 'invalid-resolved-package-id',
        errorMessage: `MVR resolver returned an invalid package id: ${String(resolved.package)}`,
      };
    }

    if (resolved.network && resolved.network !== network) {
      return {
        status: 'mismatch',
        entry,
        network,
        mvrName,
        packageId,
        packageInfoId,
        resolvedPackageId,
        resolvedNetwork: resolved.network,
        reason: 'resolved-network-mismatch',
      };
    }

    if (!resolvedPackageInfoId) {
      return {
        status: 'unreachable',
        entry,
        network,
        mvrName,
        packageId,
        packageInfoId,
        resolvedPackageId,
        reason: 'missing-resolved-package-info-id',
        errorMessage: 'MVR resolver did not return a PackageInfo object id',
      };
    }

    if (resolvedPackageId !== packageId) {
      return {
        status: 'mismatch',
        entry,
        network,
        mvrName,
        packageId,
        packageInfoId,
        resolvedPackageId,
        resolvedPackageInfoId,
        reason: 'resolved-package-id-mismatch',
      };
    }

    if (resolvedPackageInfoId !== packageInfoId) {
      return {
        status: 'mismatch',
        entry,
        network,
        mvrName,
        packageId,
        packageInfoId,
        resolvedPackageId,
        resolvedPackageInfoId,
        reason: 'resolved-package-info-id-mismatch',
      };
    }

    return {
      status: 'verified',
      entry,
      network,
      mvrName,
      packageId,
      packageInfoId,
      resolvedPackageId,
      resolvedPackageInfoId,
    };
  } catch (error) {
    return {
      status: 'unreachable',
      entry,
      network,
      mvrName,
      packageId,
      packageInfoId,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyMoveRegistryPackagesForRelease(
  entries: MoveRegistryResolvablePackage[],
  resolver: MoveRegistryResolver,
): Promise<MoveRegistryReleaseVerification> {
  const hasCorePackage = entries.some((entry) => entry.role === 'core');

  const results = await Promise.all(
    entries.map((entry) => verifyMoveRegistryPackage(entry, resolver)),
  );

  if (!hasCorePackage) {
    return { ok: false, reason: 'missing-core-package', results };
  }

  if (results.every((result) => result.status === 'verified')) {
    return { ok: true, results };
  }

  return { ok: false, reason: 'verification-failed', results };
}

function normalizePackageId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!SUI_OBJECT_ID_PATTERN.test(value)) return undefined;
  try {
    return normalizeSuiObjectId(value);
  } catch {
    return undefined;
  }
}

function isSuiNetwork(value: string): value is DappIndexSuiNetwork {
  return value === 'mainnet' || value === 'testnet';
}
