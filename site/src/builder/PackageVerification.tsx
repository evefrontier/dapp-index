import type { MoveRegistryVerificationResult } from '@/chain/moveRegistry.types';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';

export function PackageVerificationResultLine({
  result,
}: {
  result?: MoveRegistryVerificationResult;
}) {
  if (!result || result.status === 'verified') return null;

  const presentation = getPackageVerificationPresentation({
    kind: 'result',
    result,
  });
  if (!presentation.body) return null;

  return (
    <p className="text-xs text-(--color-neutral-60)">
      <span className="font-bold uppercase text-(--color-alert)">
        {presentation.title}:
      </span>{' '}
      {presentation.body}
    </p>
  );
}

export function PackageVerificationSummary({
  packageCount,
  verificationBlocker,
  verification,
}: {
  packageCount: number;
  verificationBlocker: string | null;
  verification: RegistrationDraftPackageVerificationState;
}) {
  const statusLine = getPackageMvrMatchStatusLine({
    packageCount,
    verificationBlocker,
    verification,
  });

  if (!statusLine) return null;

  return <p className="text-xs text-(--color-neutral-60)">{statusLine}</p>;
}

export function getPackageMvrMatchStatusLine({
  packageCount,
  verificationBlocker,
  verification,
}: {
  packageCount: number;
  verificationBlocker: string | null;
  verification: RegistrationDraftPackageVerificationState;
}): string | null {
  if (packageCount === 0) {
    return 'Packages are optional for dapps without Move code.';
  }

  switch (verification.status) {
    case 'idle':
      return verificationBlocker ?? 'Not checked yet.';
    case 'verifying':
      return 'Checking MVR match…';
    case 'ready':
      return 'All MVR names match.';
    case 'not-ready': {
      const results = verification.result?.results ?? [];
      const total = results.length;
      const failed = results.filter(
        (result) => result.status !== 'verified',
      ).length;
      return total > 0
        ? `${failed} of ${total} ${total === 1 ? 'package' : 'packages'} did not match.`
        : 'Resolve MVR match issues.';
    }
    case 'error':
      return verification.errorMessage ?? 'Could not check MVR match.';
  }
}

type PackageVerificationPresentation = {
  title: string;
  body: string;
};

type PackageVerificationPresentationInput = {
  kind: 'result';
  result: MoveRegistryVerificationResult;
};

function getPackageVerificationPresentation(
  input: PackageVerificationPresentationInput,
): PackageVerificationPresentation {
  switch (input.kind) {
    case 'result':
      return getResultPresentation(input.result);
  }
}

function getResultPresentation(
  result: MoveRegistryVerificationResult,
): PackageVerificationPresentation {
  switch (result.status) {
    case 'verified':
      return {
        title: 'Match',
        body: 'MVR name matches package ID.',
      };
    case 'mismatch':
      return {
        title: 'No match',
        body: getMoveRegistryVerificationMessage(result),
      };
    case 'missing':
      return {
        title: 'Missing',
        body: getMoveRegistryVerificationMessage(result),
      };
    case 'unreachable':
      return {
        title: 'Unreachable',
        body: getMoveRegistryVerificationMessage(result),
      };
  }
}

const VERIFICATION_REASON_MESSAGES: Record<string, string> = {
  'invalid-network': 'Package network is not a supported Sui network.',
  'missing-mvr-name': 'Add an MVR name to check MVR match.',
  'invalid-mvr-name':
    'MVR name is not valid. Use the format @suins/pkg or name.sui/pkg.',
  'missing-package-id': 'Add a package ID for this package.',
  'invalid-package-id': 'Package ID is not a valid Sui object ID.',
  'missing-package-info-id': 'PackageInfo ID is missing.',
  'invalid-package-info-id': 'PackageInfo ID is not a valid Sui object ID.',
  'missing-resolved-package-id':
    'MVR did not return a package ID for this name.',
  'invalid-resolved-package-id':
    'MVR returned an invalid package ID for this name.',
  'missing-resolved-package-info-id':
    'MVR did not return a PackageInfo ID for this name.',
  'invalid-resolved-package-info-id':
    'MVR returned an invalid PackageInfo ID for this name.',
  'missing-mvr-resolver':
    'Could not reach the Move Registry resolver. Try again.',
  'invalid-mvr-resolver-shape':
    'Could not reach the Move Registry resolver. Try again.',
};

/**
 * Maps a verification result to a builder-facing message. Mismatch reasons
 * surface the resolved identity so builders can compare against their entry.
 */
export function getMoveRegistryVerificationMessage(
  result: MoveRegistryVerificationResult,
): string {
  switch (result.reason) {
    case 'resolved-package-id-mismatch':
      return result.resolvedPackageId
        ? `MVR resolves to a different package ID (${shortenSuiId(result.resolvedPackageId)}). Check the name on moveregistry.com or update your package ID.`
        : 'MVR resolves to a different package ID. Check the name on moveregistry.com or update your package ID.';
    case 'resolved-package-info-id-mismatch':
      return result.resolvedPackageInfoId
        ? `MVR resolves to a different PackageInfo ID (${shortenSuiId(result.resolvedPackageInfoId)}). Update your PackageInfo ID.`
        : 'MVR resolves to a different PackageInfo ID. Update your PackageInfo ID.';
    case 'resolved-network-mismatch':
      return result.resolvedNetwork
        ? `MVR registers this name on ${result.resolvedNetwork}, not ${result.network ?? 'the selected network'}.`
        : 'MVR registers this name on a different network.';
    default:
      break;
  }

  if (result.reason && VERIFICATION_REASON_MESSAGES[result.reason]) {
    return VERIFICATION_REASON_MESSAGES[result.reason];
  }

  if (result.errorMessage) return result.errorMessage;

  return 'Could not check this package against MVR.';
}

function shortenSuiId(id: string): string {
  if (id.length <= 13) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
