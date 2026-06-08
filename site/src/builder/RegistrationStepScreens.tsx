import type { DraftStep } from '@/storage/draftStorage';
import { AboutStepScreen } from './AboutStepScreen';
import { BasicsStepScreen } from './BasicsStepScreen';
import { DiscoveryStepScreen } from './DiscoveryStepScreen';
import { PackagesStepScreen } from './PackagesStepScreen';
import type {
  RegistrationDraftFieldErrors,
  RegistrationDraftFields,
} from './registrationDraftFields';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';

export type RegistrationStepScreenProps = {
  activeStep: DraftStep;
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  packageVerification: RegistrationDraftPackageVerificationState;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onVerifyPackages: () => Promise<void>;
};

export function RegistrationStepScreen({
  activeStep,
  errors,
  fields,
  packageVerification,
  onUpdateFields,
  onVerifyPackages,
}: RegistrationStepScreenProps) {
  switch (activeStep) {
    case 'basics':
      return (
        <BasicsStepScreen
          errors={errors}
          fields={fields}
          onUpdateFields={onUpdateFields}
        />
      );
    case 'about':
      return (
        <AboutStepScreen
          errors={errors}
          fields={fields}
          onUpdateFields={onUpdateFields}
        />
      );
    case 'discovery':
      return (
        <DiscoveryStepScreen
          errors={errors}
          fields={fields}
          onUpdateFields={onUpdateFields}
        />
      );
    case 'packages':
      return (
        <PackagesStepScreen
          fields={fields}
          packageVerification={packageVerification}
          onUpdateFields={onUpdateFields}
          onVerifyPackages={onVerifyPackages}
        />
      );
    default:
      return (
        <p className="text-sm text-(--color-neutral-60)">
          Screen content lands in a later builder PR.
        </p>
      );
  }
}
