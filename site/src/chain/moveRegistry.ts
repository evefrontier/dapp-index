import { normalizeSuiObjectId } from '@mysten/sui/utils';
import type { DappIndexSuiNetwork } from '../types/dapp-index';
import type {
  MoveRegistryPackageDeclaration,
  MoveRegistryReleaseVerification,
  MoveRegistryResolvablePackage,
  MoveRegistryResolver,
  MoveRegistryVerificationContext,
  MoveRegistryVerificationDetails,
  MoveRegistryVerificationResult,
  MoveRegistryVerificationStatus,
} from './moveRegistry.types';

export const MVR_NAME_PATTERN_SOURCE =
  '(@[a-z0-9][a-z0-9-]*|[a-z0-9][a-z0-9-]*\\.sui)/[a-z0-9][a-z0-9_-]*(?:/[1-9][0-9]*)?';
export const MVR_NAME_PATTERN = new RegExp(`^${MVR_NAME_PATTERN_SOURCE}$`);
const SUI_OBJECT_ID_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export function isValidMvrName(value: string): boolean {
  return MVR_NAME_PATTERN.test(value.trim());
}

export async function verifyMoveRegistryPackage(
  entry: MoveRegistryResolvablePackage,
  resolver: MoveRegistryResolver,
): Promise<MoveRegistryVerificationResult> {
  const declaration = declareMoveRegistryPackage(entry);

  if (!declaration.ok) {
    return declaration.result;
  }

  const declared = declaration.declared;
  const { network, mvrName, packageId, packageInfoId } = declared;
  const packageResolver = resolver.core?.mvr ?? resolver.mvr;
  if (!packageResolver) {
    return moveRegistryVerificationResult('unreachable', declared, {
      errorMessage: 'MVR resolver is unavailable',
    });
  }

  try {
    const resolved = await packageResolver.resolvePackage({
      package: mvrName,
      network,
    });
    const resolvedPackageId = normalizePackageId(resolved.package);
    const resolvedPackageInfoId = normalizePackageId(resolved.packageInfoId);

    if (!resolvedPackageId) {
      return moveRegistryVerificationResult('unreachable', declared, {
        reason: 'invalid-resolved-package-id',
        errorMessage: `MVR resolver returned an invalid package id: ${String(resolved.package)}`,
      });
    }

    if (resolved.network && resolved.network !== network) {
      return moveRegistryVerificationResult(
        'mismatch',
        {
          ...declared,
          resolvedPackageId,
          resolvedNetwork: resolved.network,
        },
        {
          reason: 'resolved-network-mismatch',
        },
      );
    }

    if (!resolvedPackageInfoId) {
      return moveRegistryVerificationResult(
        'unreachable',
        {
          ...declared,
          resolvedPackageId,
        },
        {
          reason: 'missing-resolved-package-info-id',
          errorMessage: 'MVR resolver did not return a PackageInfo object id',
        },
      );
    }

    if (resolvedPackageId !== packageId) {
      return moveRegistryVerificationResult(
        'mismatch',
        {
          ...declared,
          resolvedPackageId,
          resolvedPackageInfoId,
        },
        {
          reason: 'resolved-package-id-mismatch',
        },
      );
    }

    if (resolvedPackageInfoId !== packageInfoId) {
      return moveRegistryVerificationResult(
        'mismatch',
        {
          ...declared,
          resolvedPackageId,
          resolvedPackageInfoId,
        },
        {
          reason: 'resolved-package-info-id-mismatch',
        },
      );
    }

    return moveRegistryVerificationResult('verified', {
      ...declared,
      resolvedPackageId,
      resolvedPackageInfoId,
    });
  } catch (error) {
    return moveRegistryVerificationResult('unreachable', declared, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
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

function declareMoveRegistryPackage(
  entry: MoveRegistryResolvablePackage,
): MoveRegistryPackageDeclaration {
  const network = entry.network;
  const mvrName = entry.mvrName?.trim();
  const packageId = normalizePackageId(entry.packageId);
  const packageInfoId = normalizePackageId(entry.packageInfoId);

  if (!isSuiNetwork(network)) {
    return rejectMoveRegistryPackageDeclaration({ entry }, 'invalid-network');
  }

  if (!mvrName) {
    return rejectMoveRegistryPackageDeclaration(
      { entry, network },
      'missing-mvr-name',
    );
  }

  if (!isValidMvrName(mvrName)) {
    return rejectMoveRegistryPackageDeclaration(
      { entry, network, mvrName },
      'invalid-mvr-name',
    );
  }

  if (!packageId) {
    return rejectMoveRegistryPackageDeclaration(
      { entry, network, mvrName },
      'missing-package-id',
    );
  }

  if (!packageInfoId) {
    return rejectMoveRegistryPackageDeclaration(
      { entry, network, mvrName, packageId },
      'missing-package-info-id',
    );
  }

  return {
    ok: true,
    declared: { entry, network, mvrName, packageId, packageInfoId },
  };
}

function rejectMoveRegistryPackageDeclaration(
  context: MoveRegistryVerificationContext,
  reason: string,
): MoveRegistryPackageDeclaration {
  return {
    ok: false,
    result: moveRegistryVerificationResult('missing', context, { reason }),
  };
}

function moveRegistryVerificationResult(
  status: MoveRegistryVerificationStatus,
  context: MoveRegistryVerificationContext,
  details: MoveRegistryVerificationDetails = {},
): MoveRegistryVerificationResult {
  return { status, ...context, ...details };
}
