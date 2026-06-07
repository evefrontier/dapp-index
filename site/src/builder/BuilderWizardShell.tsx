import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type {
  Draft,
  DraftAutosaveStatus,
  DraftMediaUpdate,
  DraftStep,
} from '@/storage/draftStorage';
import { BuilderMediaUploadAction } from './BuilderMediaStepScreen';
import { BuilderRegistrationStepScreen } from './BuilderRegistrationStepScreens';
import {
  createBuilderWizardStepItems,
  getBuilderWizardAdjacentStep,
  getBuilderWizardStatusLabel,
  getBuilderWizardStepLabel,
  isBuilderWizardPlaceholderStep,
  type BuilderWizardStepItem,
} from './builderWizardModel';
import {
  isRegistrationDraftStepValid,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFields,
} from './registrationDraftFields';
import {
  addRegistrationDraftPackage,
  type RegistrationDraftPackageVerificationState,
} from './registrationDraftPackages';
import type {
  RegistrationDraftReview,
  RegistrationDraftSlugCheckState,
} from './registrationDraftReview';

export type BuilderWizardShellProps = {
  activeStep: DraftStep;
  autosaveError: string | null;
  autosaveStatus: DraftAutosaveStatus;
  draft: Draft;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  mediaError: string | null;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  metadataHashError: string | null;
  metadataHashHex: string | null;
  metadataHashPending: boolean;
  navigationError: string | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  onCheckSlug: () => Promise<void>;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onUploadMedia: (files: File[]) => Promise<void>;
  onVerifyPackages: () => Promise<void>;
};

export function BuilderWizardShell({
  activeStep,
  autosaveError,
  autosaveStatus,
  draft,
  fieldErrors,
  fields,
  mediaError,
  mediaPending,
  mediaPreviewUrls,
  metadataHashError,
  metadataHashHex,
  metadataHashPending,
  navigationError,
  navigationPending,
  packageVerification,
  review,
  slugCheck,
  onCheckSlug,
  onDeleteMedia,
  onExitWizard,
  onNavigateStep,
  onUpdateMedia,
  onUpdateFields,
  onUploadMedia,
  onVerifyPackages,
}: BuilderWizardShellProps) {
  const stepItems = createBuilderWizardStepItems(
    activeStep,
    draft.completedSteps,
  );
  const title = getBuilderWizardStepLabel(activeStep);
  const previousStep = getBuilderWizardAdjacentStep(activeStep, 'previous');
  const nextStep = getBuilderWizardAdjacentStep(activeStep, 'next');
  const statusLabel = getBuilderWizardStatusLabel(autosaveStatus);
  const errorMessage = navigationError ?? autosaveError;
  const canNavigateNext =
    !nextStep ||
    isBuilderStepReadyForNext(activeStep, fields, review, slugCheck);

  return (
    <div className="space-y-6">
      <WizardHeader statusLabel={statusLabel} title={title} />
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
          onExitWizard={onExitWizard}
          onDeleteMedia={onDeleteMedia}
          onNavigateStep={onNavigateStep}
          onUpdateMedia={onUpdateMedia}
          onUpdateFields={onUpdateFields}
          onUploadMedia={onUploadMedia}
          mediaError={mediaError}
          mediaPending={mediaPending}
          mediaPreviewUrls={mediaPreviewUrls}
          metadataHashError={metadataHashError}
          metadataHashHex={metadataHashHex}
          metadataHashPending={metadataHashPending}
          packageVerification={packageVerification}
          review={review}
          slugCheck={slugCheck}
          onCheckSlug={onCheckSlug}
          onVerifyPackages={onVerifyPackages}
        />
      </div>
    </div>
  );
}

export function BuilderWizardMessage({
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
  items: BuilderWizardStepItem[];
  navigationPending: boolean;
  onNavigateStep: (step: DraftStep) => Promise<void>;
}) {
  const stepButtons = items.map((item) => (
    <li key={item.step}>
      <button
        type="button"
        aria-current={item.step === activeStep ? 'step' : undefined}
        className={getStepButtonClassName(item)}
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
  mediaPending,
  mediaPreviewUrls,
  metadataHashError,
  metadataHashHex,
  metadataHashPending,
  nextStep,
  navigationPending,
  packageVerification,
  previousStep,
  review,
  slugCheck,
  title,
  onCheckSlug,
  onDeleteMedia,
  onExitWizard,
  onNavigateStep,
  onUpdateMedia,
  onUpdateFields,
  onUploadMedia,
  onVerifyPackages,
}: {
  activeStep: DraftStep;
  canNavigateNext: boolean;
  draft: Draft;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  mediaError: string | null;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  metadataHashError: string | null;
  metadataHashHex: string | null;
  metadataHashPending: boolean;
  nextStep: DraftStep | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  previousStep: DraftStep | null;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  title: string;
  onCheckSlug: () => Promise<void>;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onUploadMedia: (files: File[]) => Promise<void>;
  onVerifyPackages: () => Promise<void>;
}) {
  const isPlaceholderStep = isBuilderWizardPlaceholderStep(activeStep);
  const headerAction =
    activeStep === 'media' ? (
      <BuilderMediaUploadAction
        disabled={mediaPending}
        onUploadMedia={onUploadMedia}
      />
    ) : activeStep === 'packages' ? (
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
    ) : null;

  return (
    <main className="min-w-0 space-y-5">
      <section className="border border-(--color-neutral-20) p-4">
        <div className="space-y-4">
          <WizardStepPanelHeader
            action={headerAction}
            draftId={draft.id}
            showDraftMeta={isPlaceholderStep}
            title={title}
          />
          <BuilderRegistrationStepScreen
            activeStep={activeStep}
            errors={fieldErrors}
            fields={fields}
            media={draft.media}
            mediaError={mediaError}
            mediaPending={mediaPending}
            mediaPreviewUrls={mediaPreviewUrls}
            metadataHashError={metadataHashError}
            metadataHashHex={metadataHashHex}
            metadataHashPending={metadataHashPending}
            packageVerification={packageVerification}
            review={review}
            slugCheck={slugCheck}
            onCheckSlug={onCheckSlug}
            onDeleteMedia={onDeleteMedia}
            onUpdateMedia={onUpdateMedia}
            onUpdateFields={onUpdateFields}
            onVerifyPackages={onVerifyPackages}
          />
        </div>
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
        <div className="flex flex-wrap gap-2">
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
          <Button
            variant="primary"
            size="small"
            disabled={navigationPending || !nextStep || !canNavigateNext}
            onClick={() => {
              if (nextStep) void onNavigateStep(nextStep);
            }}
          >
            Next
          </Button>
        </div>
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

function getStepButtonClassName(item: BuilderWizardStepItem): string {
  const baseClassName =
    'flex w-full items-center justify-between gap-3 border px-3 py-2 text-left text-sm font-bold uppercase transition-colors disabled:cursor-default';

  if (item.state === 'active') {
    return `${baseClassName} border-(--color-martian-red) text-(--color-neutral)`;
  }

  if (item.state === 'complete') {
    return `${baseClassName} border-(--color-neutral-20) text-(--color-martian-red) hover:border-(--color-martian-red)`;
  }

  return `${baseClassName} border-(--color-neutral-20) text-(--color-neutral-60) hover:border-(--color-neutral-50)`;
}

function StepStateLabel({ item }: { item: BuilderWizardStepItem }) {
  if (item.state === 'available') return null;

  const label = item.state === 'active' ? 'Now' : 'Done';

  return <span className="text-xs">{label}</span>;
}

function isBuilderStepReadyForNext(
  step: DraftStep,
  fields: RegistrationDraftFields,
  review: RegistrationDraftReview,
  slugCheck: RegistrationDraftSlugCheckState,
): boolean {
  if (step === 'review') {
    return review.ready && isReviewSlugCheckReady(slugCheck);
  }
  return isRegistrationDraftStepValid(step, fields);
}

function isReviewSlugCheckReady(
  slugCheck: RegistrationDraftSlugCheckState,
): boolean {
  return (
    slugCheck.status === 'available' || slugCheck.status === 'unconfigured'
  );
}
