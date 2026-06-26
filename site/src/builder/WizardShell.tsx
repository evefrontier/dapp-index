import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type {
  Draft,
  DraftAutosaveStatus,
  DraftMediaUpdate,
  DraftStep,
} from '@/storage/draftStorage';
import { RegistrationStepScreen } from './RegistrationStepScreens';
import { PublishStepGuide } from './PublishStepGuide';
import {
  createWizardStepItems,
  getWizardAdjacentStep,
  getWizardStatusLabel,
  getWizardStepLabel,
  isWizardPlaceholderStep,
  type WizardStepItem,
} from './wizardModel';
import {
  isRegistrationDraftStepValid,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFields,
} from './registrationDraftFields';
import {
  addRegistrationDraftPackage,
  type RegistrationDraftPackageVerificationState,
} from './registrationDraftPackages';
import type { RegistrationDraftMediaErrors } from './registrationDraftMedia';
import type { MediaSlotId } from './mediaSlotModel';
import {
  getReviewNextBlockerMessage,
  isReviewSlugCheckReady,
  type RegistrationDraftReview,
  type RegistrationDraftSlugCheckState,
} from './registrationDraftReview';
import type { PublishStepControllerState } from './publishStepPresentation';
import { PublishStepFooter } from './PublishStepFooter';
import type { ReviewStepControllerState } from './reviewStepPresentation';

export type WizardShellProps = {
  activeStep: DraftStep;
  autosaveError: string | null;
  autosaveStatus: DraftAutosaveStatus;
  draft: Draft;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  mediaError: string | null;
  mediaErrors: RegistrationDraftMediaErrors;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  navigationError: string | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  publishStep: PublishStepControllerState;
  readOnly: boolean;
  reviewStep: ReviewStepControllerState;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
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

export function WizardShell({
  activeStep,
  autosaveError,
  autosaveStatus,
  draft,
  fieldErrors,
  fields,
  mediaError,
  mediaErrors,
  mediaPending,
  mediaPreviewUrls,
  navigationError,
  navigationPending,
  packageVerification,
  publishStep,
  readOnly,
  reviewStep,
  onDeleteMedia,
  onExitWizard,
  onNavigateStep,
  onUpdateMedia,
  onUpdateFields,
  onUploadMediaForSlot,
  onVerifyPackages,
}: WizardShellProps) {
  const stepItems = createWizardStepItems(
    activeStep,
    draft.completedSteps,
  );
  const title = getWizardStepLabel(activeStep);
  const previousStep = getWizardAdjacentStep(activeStep, 'previous');
  const nextStep = getWizardAdjacentStep(activeStep, 'next');
  const statusLabel = getWizardStatusLabel(autosaveStatus);
  const errorMessage = navigationError ?? autosaveError;
  const canNavigateNext =
    readOnly ||
    !nextStep ||
    isWizardStepReadyForNext(
      activeStep,
      fields,
      draft.media,
      reviewStep.review,
      reviewStep.slugCheck,
    );

  return (
    <div className="space-y-6">
      <WizardHeader statusLabel={statusLabel} title={title} />
      {readOnly ? <WizardPublishedBanner /> : null}
      <WizardErrorMessage message={errorMessage} />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <WizardStepNav
          activeStep={activeStep}
          items={stepItems}
          navigationPending={navigationPending}
          onNavigateStep={onNavigateStep}
        />
        <WizardStepPanel
          draft={draft}
          fieldErrors={fieldErrors}
          fields={fields}
          nextStep={nextStep}
          previousStep={previousStep}
          title={title}
          activeStep={activeStep}
          canNavigateNext={canNavigateNext}
          navigationPending={navigationPending}
          readOnly={readOnly}
          onExitWizard={onExitWizard}
          onDeleteMedia={onDeleteMedia}
          onNavigateStep={onNavigateStep}
          onUpdateMedia={onUpdateMedia}
          onUpdateFields={onUpdateFields}
          onUploadMediaForSlot={onUploadMediaForSlot}
          mediaError={mediaError}
          mediaErrors={mediaErrors}
          mediaPending={mediaPending}
          mediaPreviewUrls={mediaPreviewUrls}
          packageVerification={packageVerification}
          publishStep={publishStep}
          reviewStep={reviewStep}
          onVerifyPackages={onVerifyPackages}
        />
      </div>
    </div>
  );
}

function WizardPublishedBanner() {
  return (
    <div
      className="border border-(--color-neutral-20) bg-(--color-crude-20) p-3 text-sm text-(--color-neutral-60)"
      role="status"
    >
      Published on Sui. This local draft is kept as a read-only record. Delete it
      from the drafts list when you no longer need it.
    </div>
  );
}

export function WizardMessage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-(--color-neutral)">
          {title}
        </h1>
        <p className="text-sm text-(--color-neutral-60)">{body}</p>
      </div>
      <Link
        to="/builder"
        className="text-sm font-bold uppercase text-(--color-martian-red)"
      >
        Back to drafts
      </Link>
    </div>
  );
}

function WizardHeader({
  statusLabel,
  title,
}: {
  statusLabel: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-bold uppercase text-(--color-neutral-60)">
          Listing wizard
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-(--color-neutral)">
          {title}
        </h1>
      </div>
      <div className="border border-(--color-neutral-20) px-3 py-2 text-xs font-bold uppercase text-(--color-neutral-60)">
        {statusLabel}
      </div>
    </div>
  );
}

function WizardErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      className="border border-(--color-alert) p-3 text-sm text-(--color-alert)"
      role="alert"
    >
      {message}
    </div>
  );
}

function WizardStepNav({
  activeStep,
  items,
  navigationPending,
  onNavigateStep,
}: {
  activeStep: DraftStep;
  items: WizardStepItem[];
  navigationPending: boolean;
  onNavigateStep: (step: DraftStep) => Promise<void>;
}) {
  const stepButtons = items.map((item) => (
    <li key={item.step}>
      <button
        type="button"
        aria-current={item.step === activeStep ? 'step' : undefined}
        className="builder-wizard-step"
        data-state={item.state}
        disabled={navigationPending || item.step === activeStep}
        onClick={() => {
          void onNavigateStep(item.step);
        }}
      >
        <span>{item.label}</span>
        <StepStateLabel item={item} />
      </button>
    </li>
  ));

  return (
    <nav aria-label="Listing steps">
      <ol className="grid gap-2">{stepButtons}</ol>
    </nav>
  );
}

function WizardStepPanel({
  activeStep,
  canNavigateNext,
  draft,
  fieldErrors,
  fields,
  mediaError,
  mediaErrors,
  mediaPending,
  mediaPreviewUrls,
  nextStep,
  navigationPending,
  packageVerification,
  previousStep,
  publishStep,
  readOnly,
  reviewStep,
  title,
  onDeleteMedia,
  onExitWizard,
  onNavigateStep,
  onUpdateMedia,
  onUpdateFields,
  onUploadMediaForSlot,
  onVerifyPackages,
}: {
  activeStep: DraftStep;
  canNavigateNext: boolean;
  draft: Draft;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  mediaError: string | null;
  mediaErrors: RegistrationDraftMediaErrors;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  nextStep: DraftStep | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  previousStep: DraftStep | null;
  publishStep: PublishStepControllerState;
  readOnly: boolean;
  reviewStep: ReviewStepControllerState;
  title: string;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
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
}) {
  const isPlaceholderStep = isWizardPlaceholderStep(activeStep);
  const reviewNextBlocker =
    activeStep === 'review' && nextStep && !canNavigateNext
      ? getReviewNextBlockerMessage(reviewStep.review, reviewStep.slugCheck)
      : null;
  const headerAction =
    activeStep === 'packages' ? (
      <Button
        variant="secondary"
        size="small"
        onClick={() =>
          onUpdateFields({
            suiPackages: addRegistrationDraftPackage(fields.suiPackages),
          })
        }
      >
        Add package
      </Button>
    ) : activeStep === 'publish' && !readOnly ? (
      <PublishStepGuide mediaItemCount={publishStep.mediaItemCount} />
    ) : null;

  return (
    <main className="min-w-0 space-y-5">
      <section className="border border-(--color-neutral-20) p-4">
        <fieldset className="contents" disabled={readOnly}>
          <div className="space-y-4">
            <WizardStepPanelHeader
              action={headerAction}
              draftId={draft.id}
              showDraftMeta={isPlaceholderStep}
              title={title}
            />
            <RegistrationStepScreen
              activeStep={activeStep}
              errors={fieldErrors}
              fields={fields}
              media={draft.media}
              mediaError={mediaError}
              mediaErrors={mediaErrors}
              mediaPending={mediaPending}
              mediaPreviewUrls={mediaPreviewUrls}
              packageVerification={packageVerification}
              publishStep={publishStep}
              readOnly={readOnly}
              reviewStep={reviewStep}
              onDeleteMedia={onDeleteMedia}
              onUpdateMedia={onUpdateMedia}
              onUpdateFields={onUpdateFields}
              onUploadMediaForSlot={onUploadMediaForSlot}
              onVerifyPackages={onVerifyPackages}
            />
          </div>
        </fieldset>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="text-sm font-bold uppercase text-(--color-martian-red)"
          disabled={navigationPending}
          onClick={() => {
            void onExitWizard();
          }}
        >
          Back to drafts
        </button>
        {activeStep === 'publish' && !readOnly ? (
          <PublishStepFooter publishStep={publishStep} />
        ) : (
          <div className="builder-wizard-nav-actions">
            {reviewNextBlocker ? (
              <p className="builder-wizard-next-blocker">{reviewNextBlocker}</p>
            ) : null}
            <Button
              variant="secondary"
              size="small"
              disabled={navigationPending || !previousStep}
              onClick={() => {
                if (previousStep) void onNavigateStep(previousStep);
              }}
            >
              Back
            </Button>
            {nextStep ? (
              <Button
                variant="primary"
                size="small"
                disabled={navigationPending || !canNavigateNext}
                onClick={() => {
                  void onNavigateStep(nextStep);
                }}
              >
                Next
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

function WizardStepPanelHeader({
  action,
  draftId,
  showDraftMeta,
  title,
}: {
  action?: ReactNode;
  draftId: string;
  showDraftMeta: boolean;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold uppercase text-(--color-neutral)">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {showDraftMeta ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="font-bold uppercase text-(--color-neutral-60)">
            Draft
          </dt>
          <dd className="break-all text-(--color-neutral)">{draftId}</dd>
          <dt className="font-bold uppercase text-(--color-neutral-60)">
            Step
          </dt>
          <dd className="text-(--color-neutral)">{title}</dd>
        </dl>
      ) : null}
    </div>
  );
}

function StepStateLabel({ item }: { item: WizardStepItem }) {
  if (item.state === 'available') return null;

  const label = item.state === 'active' ? 'Now' : 'Done';

  return <span className="text-xs">{label}</span>;
}

function isWizardStepReadyForNext(
  step: DraftStep,
  fields: RegistrationDraftFields,
  media: Draft['media'],
  review: RegistrationDraftReview,
  slugCheck: RegistrationDraftSlugCheckState,
): boolean {
  if (step === 'review') {
    return review.ready && isReviewSlugCheckReady(slugCheck);
  }

  return isRegistrationDraftStepValid(step, fields, media);
}
