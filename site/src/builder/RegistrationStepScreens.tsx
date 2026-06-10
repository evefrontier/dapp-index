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
import { PublishStepScreen } from './PublishStepScreen';
import { ReviewStepScreen } from './ReviewStepScreen';
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
import type {
  RegistrationDraftPublishController,
  RegistrationDraftPublishState,
} from './useRegistrationDraftPublishController';

export type RegistrationStepScreenProps = {
  activeStep: DraftStep;
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  media: DraftMedia[];
  mediaError: string | null;
  mediaErrors: RegistrationDraftMediaErrors;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  metadataHashError: string | null;
  metadataHashHex: string | null;
  metadataHashPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  publishReadiness: RegistrationDraftPublishController['publishReadiness'];
  publishState: RegistrationDraftPublishState;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  suiNetwork: string;
  walletAddress: string | null;
  walletBalanceStatus: RegistrationDraftPublishController['walletBalanceStatus'];
  walletNetwork: string | null;
  onCheckSlug: () => Promise<void>;
  onConnectWallet: () => void;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onPublish: () => Promise<void>;
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
  mediaErrors,
  mediaPending,
  mediaPreviewUrls,
  metadataHashError,
  metadataHashHex,
  metadataHashPending,
  packageVerification,
  publishReadiness,
  publishState,
  review,
  slugCheck,
  suiNetwork,
  walletAddress,
  walletBalanceStatus,
  walletNetwork,
  onCheckSlug,
  onConnectWallet,
  onDeleteMedia,
  onPublish,
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
          mediaErrors={mediaErrors}
          pending={mediaPending}
          previewUrls={mediaPreviewUrls}
          onDeleteMedia={onDeleteMedia}
          onUpdateMedia={onUpdateMedia}
        />
      );
    case 'review':
      return (
        <ReviewStepScreen
          metadataHashError={metadataHashError}
          metadataHashHex={metadataHashHex}
          metadataHashPending={metadataHashPending}
          review={review}
          slugCheck={slugCheck}
          onCheckSlug={onCheckSlug}
        />
      );
    case 'publish':
      return (
        <PublishStepScreen
          publishReadiness={publishReadiness}
          publishState={publishState}
          suiNetwork={suiNetwork}
          walletAddress={walletAddress}
          walletBalanceStatus={walletBalanceStatus}
          walletNetwork={walletNetwork}
          onConnectWallet={onConnectWallet}
          onPublish={onPublish}
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
