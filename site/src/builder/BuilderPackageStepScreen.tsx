import { Button } from '@evefrontier/ui';
import {
  DAPP_INDEX_SUI_NETWORKS,
  DAPP_INDEX_SUI_PACKAGE_ROLES,
  type DappIndexSuiNetwork,
  type DappIndexSuiPackageRole,
} from '@/types/dapp-index';
import type { MoveRegistryVerificationResult } from '@/chain/moveRegistry.types';
import {
  BuilderFieldError,
  BuilderSelectField,
  BuilderTextField,
} from './BuilderFormFields';
import {
  getRegistrationDraftPackageVerificationBlocker,
  validateRegistrationDraftPackages,
  type RegistrationDraftPackage,
  type RegistrationDraftPackageErrors,
  type RegistrationDraftPackageVerificationState,
} from './registrationDraftPackages';

export type BuilderPackageStepScreenProps = {
  packageVerification: RegistrationDraftPackageVerificationState;
  packages: RegistrationDraftPackage[];
  onChange: (packages: RegistrationDraftPackage[]) => void;
  onVerifyPackages: () => Promise<void>;
};

export function BuilderPackageStepScreen({
  packageVerification,
  packages,
  onChange,
  onVerifyPackages,
}: BuilderPackageStepScreenProps) {
  const packageValidation = validateRegistrationDraftPackages(packages);
  const verificationBlocker =
    getRegistrationDraftPackageVerificationBlocker(packages);
  const canVerify =
    !verificationBlocker &&
    packageVerification.status !== 'verifying';

  return (
    <div className="grid gap-4">
      <BuilderFieldError
        id="builder-sui-packages"
        message={packageValidation.fieldErrors.suiPackages}
      />

      {packages.length === 0 ? (
        <EmptyPackageList />
      ) : (
        <div className="grid border-t border-(--color-neutral-20)">
          {packages.map((draftPackage, index) => (
            <PackageCard
              key={draftPackage.draftPackageId}
              draftPackage={draftPackage}
              index={index}
              packageError={packageValidation.packageErrors[index] ?? {}}
              verificationResult={packageVerification.result?.results[index]}
              onRemove={() =>
                onChange(
                  packages.filter(
                    (item) =>
                      item.draftPackageId !== draftPackage.draftPackageId,
                  ),
                )
              }
              onUpdate={(nextPackage) =>
                onChange(updatePackage(packages, nextPackage))
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-neutral-20) pt-4">
        <PackageVerificationSummary
          packageCount={packages.length}
          verificationBlocker={verificationBlocker}
          verification={packageVerification}
        />
        <Button
          variant="primary"
          size="small"
          disabled={!canVerify}
          onClick={() => {
            void onVerifyPackages();
          }}
        >
          Verify packages
        </Button>
      </div>
    </div>
  );
}

function EmptyPackageList() {
  return (
    <div className="space-y-1 border-y border-(--color-neutral-20) py-4 text-sm text-(--color-neutral-60)">
      <p>No packages added.</p>
      <p className="text-xs text-(--color-neutral-60)">
        Add one only if this dapp publishes Move code.
      </p>
    </div>
  );
}

function PackageCard({
  draftPackage,
  index,
  packageError,
  verificationResult,
  onRemove,
  onUpdate,
}: {
  draftPackage: RegistrationDraftPackage;
  index: number;
  packageError: RegistrationDraftPackageErrors;
  verificationResult?: MoveRegistryVerificationResult;
  onRemove: () => void;
  onUpdate: (draftPackage: RegistrationDraftPackage) => void;
}) {
  const packageNumber = index + 1;

  return (
    <section className="grid gap-4 border-b border-(--color-neutral-20) py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-bold uppercase text-(--color-neutral)">
            Package {packageNumber}
          </h4>
          <VerificationBadge result={verificationResult} />
        </div>
        <button
          type="button"
          className="text-xs font-bold uppercase text-(--color-alert)"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BuilderSelectField
          id={`builder-package-${draftPackage.draftPackageId}-network`}
          label="Network"
          value={draftPackage.network}
          onChange={(network) =>
            onUpdate({
              ...draftPackage,
              network: network as DappIndexSuiNetwork,
            })
          }
        >
          {DAPP_INDEX_SUI_NETWORKS.map((network) => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
        </BuilderSelectField>
        <BuilderSelectField
          id={`builder-package-${draftPackage.draftPackageId}-role`}
          label="Role"
          value={draftPackage.role}
          onChange={(role) =>
            onUpdate({
              ...draftPackage,
              role: role as DappIndexSuiPackageRole,
            })
          }
        >
          {DAPP_INDEX_SUI_PACKAGE_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </BuilderSelectField>
      </div>

      <BuilderTextField
        error={packageError.packageId}
        id={`builder-package-${draftPackage.draftPackageId}-package-id`}
        label="Package ID"
        value={draftPackage.packageId}
        onChange={(packageId) => onUpdate({ ...draftPackage, packageId })}
      />
      <BuilderTextField
        error={packageError.mvrName}
        id={`builder-package-${draftPackage.draftPackageId}-mvr-name`}
        label="MVR name (optional)"
        value={draftPackage.mvrName}
        onChange={(mvrName) => onUpdate({ ...draftPackage, mvrName })}
      />
      <BuilderTextField
        error={packageError.packageInfoId}
        id={`builder-package-${draftPackage.draftPackageId}-package-info-id`}
        label="PackageInfo ID (optional)"
        value={draftPackage.packageInfoId}
        onChange={(packageInfoId) =>
          onUpdate({ ...draftPackage, packageInfoId })
        }
      />

      <VerificationDetails result={verificationResult} />
    </section>
  );
}

function VerificationBadge({
  result,
}: {
  result?: MoveRegistryVerificationResult;
}) {
  if (!result) return null;

  const label = getVerificationResultLabel(result);

  return (
    <span className="border border-(--color-neutral-20) px-2 py-1 text-[0.6875rem] font-bold uppercase text-(--color-neutral-60)">
      {label}
    </span>
  );
}

function VerificationDetails({
  result,
}: {
  result?: MoveRegistryVerificationResult;
}) {
  if (!result) return null;

  const details = getVerificationResultDetails(result);
  if (!details) return null;

  return <p className="text-xs text-(--color-neutral-60)">{details}</p>;
}

function PackageVerificationSummary({
  packageCount,
  verificationBlocker,
  verification,
}: {
  packageCount: number;
  verificationBlocker: string | null;
  verification: RegistrationDraftPackageVerificationState;
}) {
  const summary = getVerificationSummary(
    verification,
    packageCount,
    verificationBlocker,
  );

  return (
    <div className="space-y-1 text-sm">
      <p className="font-bold uppercase text-(--color-neutral)">
        {summary.title}
      </p>
      <p className="text-xs text-(--color-neutral-60)">{summary.body}</p>
    </div>
  );
}

function updatePackage(
  packages: readonly RegistrationDraftPackage[],
  nextPackage: RegistrationDraftPackage,
): RegistrationDraftPackage[] {
  return packages.map((draftPackage) =>
    draftPackage.draftPackageId === nextPackage.draftPackageId
      ? nextPackage
      : draftPackage,
  );
}

function getVerificationResultLabel(
  result: MoveRegistryVerificationResult,
): string {
  if (result.status === 'verified') return 'Verified';
  if (result.reason === 'missing-mvr-name') return 'MVR skipped';
  if (result.status === 'mismatch') return 'Mismatch';
  if (result.status === 'missing') return 'Missing';
  return 'Unreachable';
}

function getVerificationResultDetails(
  result: MoveRegistryVerificationResult,
): string | null {
  if (result.status === 'verified') return 'MVR package matches.';
  if (result.reason === 'missing-mvr-name') {
    return 'Package ID is declared. Add MVR to verify registry identity.';
  }
  if (result.errorMessage) return result.errorMessage;
  if (result.reason) return result.reason;
  return null;
}

function getVerificationSummary(
  verification: RegistrationDraftPackageVerificationState,
  packageCount: number,
  verificationBlocker: string | null,
): {
  title: string;
  body: string;
} {
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
    default:
      return assertNever(verification.status);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled package verification state: ${String(value)}`);
}
