import { normalizeSuiObjectId } from '@mysten/sui/utils';
import type {
  DappIndexSuiNetwork,
  DappIndexSuiPackageRole,
} from '../types/dapp-index';

export const MVR_NAME_PATTERN =
  /^(@[a-z0-9][a-z0-9-]*|[a-z0-9][a-z0-9-]*\.sui)\/[a-z0-9][a-z0-9_-]*(?:\/[1-9][0-9]*)?$/;

export type MoveRegistryResolvablePackage = {
  network: DappIndexSuiNetwork;
  role: DappIndexSuiPackageRole;
  mvrName?: string;
  packageId?: string;
  packageInfoId?: string;
};

export type MoveRegistryPackageResolver = {
  resolvePackage(options: { package: string }): Promise<{ package: string }>;
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
  mvrName?: string;
  packageId?: string;
  resolvedPackageId?: string;
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
  const mvrName = entry.mvrName?.trim();
  const packageId = normalizePackageId(entry.packageId);

  if (!mvrName) {
    return { status: 'missing', entry, reason: 'missing-mvr-name' };
  }

  if (!isValidMvrName(mvrName)) {
    return { status: 'missing', entry, mvrName, reason: 'invalid-mvr-name' };
  }

  if (!packageId) {
    return { status: 'missing', entry, mvrName, reason: 'missing-package-id' };
  }

  const packageResolver = resolver.core?.mvr ?? resolver.mvr;
  if (!packageResolver) {
    return { status: 'unreachable', entry, mvrName, packageId, errorMessage: 'MVR resolver is unavailable' };
  }

  try {
    const resolved = await packageResolver.resolvePackage({ package: mvrName });
    const resolvedPackageId = normalizePackageId(resolved.package);

    if (!resolvedPackageId) {
      return {
        status: 'unreachable',
        entry,
        mvrName,
        packageId,
        reason: 'invalid-resolved-package-id',
        errorMessage: `MVR resolver returned an invalid package id: ${String(resolved.package)}`,
      };
    }

    if (resolvedPackageId === packageId) {
      return {
        status: 'verified',
        entry,
        mvrName,
        packageId,
        resolvedPackageId,
      };
    }

    return {
      status: 'mismatch',
      entry,
      mvrName,
      packageId,
      resolvedPackageId,
      reason: 'resolved-package-id-mismatch',
    };
  } catch (error) {
    return {
      status: 'unreachable',
      entry,
      mvrName,
      packageId,
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
  try {
    return normalizeSuiObjectId(value);
  } catch {
    return undefined;
  }
}
