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
import { ReviewStepScreen } from './ReviewStepScreen';
import type { MediaSlotId } from './mediaSlotModel';
import type {
  RegistrationDraftFieldErrors,
  RegistrationDraftFields,
} from './registrationDraftFields';
import type { RegistrationDraftMediaErrors } from './registrationDraftMedia';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';
import type {
  RegistrationDraftReview,
  RegistrationDraftSlugCheckState,
} from './registrationDraftReview';
import type { RegistrationDraftMetadataHashPreview } from './reviewStepPresentation';

export type RegistrationStepScreenProps = {
  activeStep: DraftStep;
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  media: DraftMedia[];
  mediaError: string | null;
  mediaErrors: RegistrationDraftMediaErrors;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  metadataHashPreview: RegistrationDraftMetadataHashPreview;
  packageVerification: RegistrationDraftPackageVerificationState;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  onCheckSlug: () => Promise<void>;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onUploadMediaForSlot: (
    slotId: MediaSlotId,
    file: File,
  ) => Promise<void>;
  onVerifyPackages: () => Promise<void>;
};

export function RegistrationStepScreen({
  activeStep,
  errors,
  fields,
  media,
  mediaError,
  mediaErrors,
  mediaPending,
  mediaPreviewUrls,
  metadataHashPreview,
  packageVerification,
  review,
  slugCheck,
  onCheckSlug,
  onDeleteMedia,
  onUpdateMedia,
  onUpdateFields,
  onUploadMediaForSlot,
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
          mediaErrors={mediaErrors}
          pending={mediaPending}
          previewUrls={mediaPreviewUrls}
          onDeleteMedia={onDeleteMedia}
          onUpdateMedia={onUpdateMedia}
          onUploadMediaForSlot={onUploadMediaForSlot}
        />
      );
    case 'review':
      return (
        <ReviewStepScreen
          metadataHashPreview={metadataHashPreview}
          review={review}
          slugCheck={slugCheck}
          onCheckSlug={onCheckSlug}
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
