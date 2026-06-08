import type {
  DraftMedia,
  DraftMediaUpdate,
  DraftStep,
} from '@/storage/draftStorage';
import { AboutStepScreen } from './AboutStepScreen';
import { BasicsStepScreen } from './BasicsStepScreen';
import { DiscoveryStepScreen } from './DiscoveryStepScreen';
import { MediaStepScreen } from './MediaStepScreen';
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
  media: DraftMedia[];
  mediaError: string | null;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  packageVerification: RegistrationDraftPackageVerificationState;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onVerifyPackages: () => Promise<void>;
};

export function RegistrationStepScreen({
  activeStep,
  errors,
  fields,
  media,
  mediaError,
  mediaPending,
  mediaPreviewUrls,
  packageVerification,
  onDeleteMedia,
  onUpdateMedia,
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
    case 'media':
      return (
        <MediaStepScreen
          errorMessage={mediaError}
          media={media}
          pending={mediaPending}
          previewUrls={mediaPreviewUrls}
          onDeleteMedia={onDeleteMedia}
          onUpdateMedia={onUpdateMedia}
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
