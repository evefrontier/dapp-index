import { Button } from '@evefrontier/ui';
import {
  DAPP_INDEX_SUI_NETWORKS,
  DAPP_INDEX_SUI_PACKAGE_ROLES,
  type DappIndexSuiNetwork,
  type DappIndexSuiPackageRole,
} from '@/types/dapp-index';
import type { MoveRegistryVerificationResult } from '@/chain/moveRegistry.types';
import {
  FieldError,
  SelectField,
  TextField,
} from './FormFields';
import {
  PackageVerificationResultLine,
  PackageVerificationSummary,
} from './PackageVerification';
import {
  getRegistrationDraftPackageVerificationBlocker,
  validateRegistrationDraftPackages,
  type RegistrationDraftPackage,
  type RegistrationDraftPackageErrors,
  type RegistrationDraftPackageVerificationState,
} from './registrationDraftPackages';

export type PackageStepScreenProps = {
  packageVerification: RegistrationDraftPackageVerificationState;
  packages: RegistrationDraftPackage[];
  onChange: (packages: RegistrationDraftPackage[]) => void;
  onVerifyPackages: () => Promise<void>;
};

export function PackageStepScreen({
  packageVerification,
  packages,
  onChange,
  onVerifyPackages,
}: PackageStepScreenProps) {
  const packageValidation = validateRegistrationDraftPackages(packages);
  const verificationBlocker =
    getRegistrationDraftPackageVerificationBlocker(packages);
  const isVerifying = packageVerification.status === 'verifying';
  const canVerify = !verificationBlocker && !isVerifying;

  return (
    <div className="grid gap-4">
      <FieldError
        id="builder-sui-packages"
        message={packageValidation.fieldErrors.suiPackages}
      />

      {packages.length === 0 ? (
        <EmptyPackageList />
      ) : (
        <>
          <div className="grid divide-y divide-(--color-neutral-20)">
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

          <PackageMvrMatchSection
            canVerify={canVerify}
            isVerifying={isVerifying}
            packageCount={packages.length}
            verification={packageVerification}
            verificationBlocker={verificationBlocker}
            onVerifyPackages={onVerifyPackages}
          />
        </>
      )}
    </div>
  );
}

function EmptyPackageList() {
  return (
    <p className="text-sm text-(--color-neutral-60)">
      No packages added yet. Use Add package if this dapp publishes Move code.
    </p>
  );
}

function PackageMvrMatchSection({
  canVerify,
  isVerifying,
  packageCount,
  verification,
  verificationBlocker,
  onVerifyPackages,
}: {
  canVerify: boolean;
  isVerifying: boolean;
  packageCount: number;
  verification: RegistrationDraftPackageVerificationState;
  verificationBlocker: string | null;
  onVerifyPackages: () => Promise<void>;
}) {
  return (
    <section className="builder-package-mvr-check border-t border-(--color-neutral-20) pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h4>MVR match check</h4>
          <PackageVerificationSummary
            packageCount={packageCount}
            verificationBlocker={verificationBlocker}
            verification={verification}
          />
        </div>
        <Button
          variant="secondary"
          size="small"
          disabled={!canVerify}
          onClick={() => {
            void onVerifyPackages();
          }}
        >
          {isVerifying ? 'Checking…' : 'Check MVR match'}
        </Button>
      </div>
    </section>
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
    <section className="grid gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm">Package {packageNumber}</h4>
        <button
          type="button"
          className="builder-text-button-danger"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
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
        </SelectField>
        <SelectField
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
        </SelectField>
      </div>

      <TextField
        error={packageError.packageId}
        id={`builder-package-${draftPackage.draftPackageId}-package-id`}
        label="Package ID"
        value={draftPackage.packageId}
        onChange={(packageId) => onUpdate({ ...draftPackage, packageId })}
      />

      <details className="builder-package-mvr-details">
        <summary className="builder-package-mvr-summary">
          {getPackageMvrSummaryLabel(draftPackage, packageError)}
        </summary>
        <div className="builder-package-mvr-fields grid gap-4">
          <TextField
            error={packageError.mvrName}
            id={`builder-package-${draftPackage.draftPackageId}-mvr-name`}
            label="MVR name"
            value={draftPackage.mvrName}
            onChange={(mvrName) => onUpdate({ ...draftPackage, mvrName })}
          />
          <TextField
            error={packageError.packageInfoId}
            id={`builder-package-${draftPackage.draftPackageId}-package-info-id`}
            label="PackageInfo ID"
            value={draftPackage.packageInfoId}
            onChange={(packageInfoId) =>
              onUpdate({ ...draftPackage, packageInfoId })
            }
          />
          <PackageVerificationResultLine result={verificationResult} />
        </div>
      </details>
    </section>
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

const PACKAGE_MVR_SUMMARY_BASE = 'Move Registry (MVR)';

export function getPackageMvrSummaryLabel(
  draftPackage: RegistrationDraftPackage,
  packageError: RegistrationDraftPackageErrors,
): string {
  if (packageError.mvrName || packageError.packageInfoId) {
    return `${PACKAGE_MVR_SUMMARY_BASE} · needs attention`;
  }

  if (draftPackage.mvrName.trim() || draftPackage.packageInfoId.trim()) {
    return `${PACKAGE_MVR_SUMMARY_BASE} · has values`;
  }

  return PACKAGE_MVR_SUMMARY_BASE;
}
