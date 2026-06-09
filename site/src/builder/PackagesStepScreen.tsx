import { PackageStepScreen } from './PackageStepScreen';
import type { RegistrationDraftFields } from './registrationDraftFields';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';

export type PackagesStepScreenProps = {
  fields: RegistrationDraftFields;
  packageVerification: RegistrationDraftPackageVerificationState;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onVerifyPackages: () => Promise<void>;
};

export function PackagesStepScreen({
  fields,
  packageVerification,
  onUpdateFields,
  onVerifyPackages,
}: PackagesStepScreenProps) {
  return (
    <PackageStepScreen
      packageVerification={packageVerification}
      packages={fields.suiPackages}
      onChange={(suiPackages) => onUpdateFields({ suiPackages })}
      onVerifyPackages={onVerifyPackages}
    />
  );
}
