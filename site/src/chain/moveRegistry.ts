import { normalizeSuiObjectId } from '@mysten/sui/utils';
import type { DappIndexSuiNetwork } from '../types/dapp-index';
import type {
  MoveRegistryPackageDeclaration,
  MoveRegistryPackageIdDeclaration,
  MoveRegistryPackageIdReason,
  MoveRegistryPackageResolver,
  MoveRegistryPackageResolverDeclaration,
  MoveRegistryPackageResolverSource,
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

  const declared = declaration.value;
  const { network, mvrName, packageId, packageInfoId } = declared;
  const packageResolver = declareMoveRegistryPackageResolver(resolver);
  if (!packageResolver.ok) {
    return moveRegistryVerificationResult('unreachable', declared, {
      reason: packageResolver.reason,
      errorMessage: packageResolver.errorMessage,
    });
  }

  try {
    const resolved = await packageResolver.value.resolvePackage({
      package: mvrName,
      network,
    });

    const resolvedPackageId = declarePackageId(
      resolved.package,
      'missing-resolved-package-id',
      'invalid-resolved-package-id',
    );

    if (!resolvedPackageId.ok) {
      return moveRegistryVerificationResult('unreachable', declared, {
        reason: resolvedPackageId.reason,
        errorMessage:
          resolvedPackageId.reason === 'missing-resolved-package-id'
            ? 'MVR resolver did not return a package id'
            : `MVR resolver returned an invalid package id: ${String(resolved.package)}`,
      });
    }

    if (resolved.network && resolved.network !== network) {
      return moveRegistryVerificationResult(
        'mismatch',
        {
          ...declared,
          resolvedPackageId: resolvedPackageId.value,
          resolvedNetwork: resolved.network,
        },
        {
          reason: 'resolved-network-mismatch',
        },
      );
    }

    const resolvedPackageInfoId = declarePackageId(
      resolved.packageInfoId,
      'missing-resolved-package-info-id',
      'invalid-resolved-package-info-id',
    );

    if (!resolvedPackageInfoId.ok) {
      return moveRegistryVerificationResult(
        'unreachable',
        {
          ...declared,
          resolvedPackageId: resolvedPackageId.value,
        },
        {
          reason: resolvedPackageInfoId.reason,
          errorMessage:
            resolvedPackageInfoId.reason === 'missing-resolved-package-info-id'
              ? 'MVR resolver did not return a PackageInfo object id'
              : `MVR resolver returned an invalid PackageInfo object id: ${String(resolved.packageInfoId)}`,
        },
      );
    }

    if (resolvedPackageId.value !== packageId) {
      return moveRegistryVerificationResult(
        'mismatch',
        {
          ...declared,
          resolvedPackageId: resolvedPackageId.value,
          resolvedPackageInfoId: resolvedPackageInfoId.value,
        },
        {
          reason: 'resolved-package-id-mismatch',
        },
      );
    }

    if (resolvedPackageInfoId.value !== packageInfoId) {
      return moveRegistryVerificationResult(
        'mismatch',
        {
          ...declared,
          resolvedPackageId: resolvedPackageId.value,
          resolvedPackageInfoId: resolvedPackageInfoId.value,
        },
        {
          reason: 'resolved-package-info-id-mismatch',
        },
      );
    }

    return moveRegistryVerificationResult('verified', {
      ...declared,
      resolvedPackageId: resolvedPackageId.value,
      resolvedPackageInfoId: resolvedPackageInfoId.value,
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

function declarePackageId(
  value: string | undefined,
  missingReason: MoveRegistryPackageIdReason,
  invalidReason: MoveRegistryPackageIdReason,
): MoveRegistryPackageIdDeclaration {
  if (!value) return { ok: false, reason: missingReason };
  if (!SUI_OBJECT_ID_PATTERN.test(value)) {
    return { ok: false, reason: invalidReason };
  }

  try {
    return { ok: true, value: normalizeSuiObjectId(value) };
  } catch {
    return { ok: false, reason: invalidReason };
  }
}

function isSuiNetwork(value: string): value is DappIndexSuiNetwork {
  return value === 'mainnet' || value === 'testnet';
}

function declareMoveRegistryPackageResolver(
  resolver: MoveRegistryResolver,
): MoveRegistryPackageResolverDeclaration {
  const coreResolver = declareMoveRegistryPackageResolverCandidate(
    'core.mvr',
    resolver.core?.mvr,
  );
  if (coreResolver.ok) {
    return coreResolver;
  }

  const rootResolver = declareMoveRegistryPackageResolverCandidate(
    'mvr',
    resolver.mvr,
  );
  if (rootResolver.ok) {
    return rootResolver;
  }

  const invalidResolver = [coreResolver, rootResolver].find(
    (candidate) => candidate.reason === 'invalid-mvr-resolver-shape',
  );

  return {
    ok: false,
    reason: invalidResolver?.reason ?? 'missing-mvr-resolver',
    errorMessage: [coreResolver.errorMessage, rootResolver.errorMessage].join(
      '; ',
    ),
  };
}

function declareMoveRegistryPackageResolverCandidate(
  source: MoveRegistryPackageResolverSource,
  value: unknown,
): MoveRegistryPackageResolverDeclaration {
  if (value === undefined || value === null) {
    return {
      ok: false,
      reason: 'missing-mvr-resolver',
      errorMessage: `MVR resolver candidate ${source} is missing`,
    };
  }

  if (typeof value !== 'object' || value === null) {
    return {
      ok: false,
      reason: 'invalid-mvr-resolver-shape',
      errorMessage: `MVR resolver candidate ${source} is not an object`,
    };
  }

  if (
    typeof (value as Partial<MoveRegistryPackageResolver>).resolvePackage !==
    'function'
  ) {
    return {
      ok: false,
      reason: 'invalid-mvr-resolver-shape',
      errorMessage: `MVR resolver candidate ${source} is missing resolvePackage()`,
    };
  }

  return {
    ok: true,
    value: value as MoveRegistryPackageResolver,
  };
}

function declareMoveRegistryPackage(
  entry: MoveRegistryResolvablePackage,
): MoveRegistryPackageDeclaration {
  const network = entry.network;
  const mvrName = entry.mvrName?.trim();
  const packageId = declarePackageId(
    entry.packageId,
    'missing-package-id',
    'invalid-package-id',
  );
  const packageInfoId = declarePackageId(
    entry.packageInfoId,
    'missing-package-info-id',
    'invalid-package-info-id',
  );

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

  if (!packageId.ok) {
    return rejectMoveRegistryPackageDeclaration(
      { entry, network, mvrName },
      packageId.reason,
    );
  }

  if (!packageInfoId.ok) {
    return rejectMoveRegistryPackageDeclaration(
      { entry, network, mvrName, packageId: packageId.value },
      packageInfoId.reason,
    );
  }

  return {
    ok: true,
    value: {
      entry,
      network,
      mvrName,
      packageId: packageId.value,
      packageInfoId: packageInfoId.value,
    },
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
