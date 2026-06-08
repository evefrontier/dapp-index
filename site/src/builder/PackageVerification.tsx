import type { MoveRegistryVerificationResult } from '@/chain/moveRegistry.types';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';

export function PackageVerificationBadge({
  result,
}: {
  result?: MoveRegistryVerificationResult;
}) {
  if (!result) return null;

  const presentation = getPackageVerificationPresentation({
    kind: 'result',
    result,
  });

  return (
    <span className="border border-(--color-neutral-20) px-2 py-1 text-[0.6875rem] font-bold uppercase text-(--color-neutral-60)">
      {presentation.title}
    </span>
  );
}

export function PackageVerificationDetails({
  result,
}: {
  result?: MoveRegistryVerificationResult;
}) {
  if (!result) return null;

  const presentation = getPackageVerificationPresentation({
    kind: 'result',
    result,
  });
  if (!presentation.body) return null;

  return <p className="text-xs text-(--color-neutral-60)">{presentation.body}</p>;
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
  const presentation = getPackageVerificationPresentation({
    kind: 'summary',
    packageCount,
    verificationBlocker,
    verification,
  });

  return (
    <div className="space-y-1 text-sm">
      <p className="font-bold uppercase text-(--color-neutral)">
        {presentation.title}
      </p>
      <p className="text-xs text-(--color-neutral-60)">{presentation.body}</p>
    </div>
  );
}

type PackageVerificationPresentation = {
  title: string;
  body: string;
};

type PackageVerificationPresentationInput =
  | {
      kind: 'result';
      result: MoveRegistryVerificationResult;
    }
  | {
      kind: 'summary';
      packageCount: number;
      verificationBlocker: string | null;
      verification: RegistrationDraftPackageVerificationState;
    };

function getPackageVerificationPresentation(
  input: PackageVerificationPresentationInput,
): PackageVerificationPresentation {
  switch (input.kind) {
    case 'result':
      return getResultPresentation(input.result);
    case 'summary':
      return getSummaryPresentation(input);
  }
}

function getResultPresentation(
  result: MoveRegistryVerificationResult,
): PackageVerificationPresentation {
  switch (result.status) {
    case 'verified':
      return {
        title: 'Verified',
        body: 'MVR package matches.',
      };
    case 'mismatch':
      return {
        title: 'Mismatch',
        body: result.errorMessage ?? result.reason ?? '',
      };
    case 'missing':
      return {
        title: 'Missing',
        body: result.errorMessage ?? result.reason ?? '',
      };
    case 'unreachable':
      return {
        title: 'Unreachable',
        body: result.errorMessage ?? result.reason ?? '',
      };
  }
}

function getSummaryPresentation({
  packageCount,
  verificationBlocker,
  verification,
}: Extract<PackageVerificationPresentationInput, { kind: 'summary' }>): PackageVerificationPresentation {
  if (packageCount === 0) {
    return {
      title: 'Optional',
      body: 'Add packages if this dapp publishes Move code.',
    };
  }

  switch (verification.status) {
    case 'idle':
      return {
        title: 'Not verified',
        body: verificationBlocker ?? 'Verify added packages before review.',
      };
    case 'verifying':
      return {
        title: 'Verifying',
        body: 'Checking Move Registry package identities.',
      };
    case 'ready':
      return {
        title: 'Verified',
        body: 'All added packages match Move Registry.',
      };
    case 'not-ready':
      return {
        title: 'Not ready',
        body: 'Resolve package verification issues.',
      };
    case 'error':
      return {
        title: 'Verification failed',
        body: verification.errorMessage ?? 'Could not verify packages.',
      };
  }
}
