import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type {
  Draft,
  DraftAutosaveStatus,
  DraftStep,
} from '@/storage/draftStorage';
import { RegistrationStepScreen } from './RegistrationStepScreens';
import {
  createWizardStepItems,
  getWizardAdjacentStep,
  getWizardStatusLabel,
  getWizardStatusTone,
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

export type WizardShellProps = {
  activeStep: DraftStep;
  autosaveError: string | null;
  autosaveStatus: DraftAutosaveStatus;
  draft: Draft;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  navigationError: string | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onVerifyPackages: () => Promise<void>;
};

export function WizardShell({
  activeStep,
  autosaveError,
  autosaveStatus,
  draft,
  fieldErrors,
  fields,
  navigationError,
  navigationPending,
  packageVerification,
  onExitWizard,
  onNavigateStep,
  onUpdateFields,
  onVerifyPackages,
}: WizardShellProps) {
  const stepItems = createWizardStepItems(
    activeStep,
    draft.completedSteps,
  );
  const title = getWizardStepLabel(activeStep);
  const nextStep = getWizardAdjacentStep(activeStep, 'next');
  const errorMessage = navigationError ?? autosaveError;
  const canNavigateNext =
    !nextStep || isRegistrationDraftStepValid(activeStep, fields);

  return (
    <div className="space-y-6">
      <WizardErrorMessage message={errorMessage} />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <WizardStepNav
            activeStep={activeStep}
            items={stepItems}
            navigationPending={navigationPending}
            onNavigateStep={onNavigateStep}
          />
          <hr className="builder-wizard-sidebar-divider" aria-hidden="true" />
          <WizardSidebarActions
            autosaveStatus={autosaveStatus}
            navigationPending={navigationPending}
            onExitWizard={onExitWizard}
          />
        </div>
        <WizardStepPanel
          draft={draft}
          fieldErrors={fieldErrors}
          fields={fields}
          nextStep={nextStep}
          title={title}
          activeStep={activeStep}
          canNavigateNext={canNavigateNext}
          navigationPending={navigationPending}
          onNavigateStep={onNavigateStep}
          onUpdateFields={onUpdateFields}
          packageVerification={packageVerification}
          onVerifyPackages={onVerifyPackages}
        />
      </div>
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

function WizardSidebarActions({
  autosaveStatus,
  navigationPending,
  onExitWizard,
}: {
  autosaveStatus: DraftAutosaveStatus;
  navigationPending: boolean;
  onExitWizard: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <WizardAutosaveTag autosaveStatus={autosaveStatus} />
      <Button
        variant="tertiary"
        size="small"
        disabled={navigationPending}
        onClick={() => {
          void onExitWizard();
        }}
      >
        Back to drafts
      </Button>
    </div>
  );
}

function WizardAutosaveTag({
  autosaveStatus,
}: {
  autosaveStatus: DraftAutosaveStatus;
}) {
  return (
    <span
      className="builder-tag-pill"
      data-tone={getWizardStatusTone(autosaveStatus)}
      aria-live="polite"
    >
      {getWizardStatusLabel(autosaveStatus)}
    </span>
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
        {item.label}
      </button>
    </li>
  ));

  return (
    <nav aria-label="Listing steps">
      <ol className="grid gap-1.5">{stepButtons}</ol>
    </nav>
  );
}

function WizardStepPanel({
  activeStep,
  canNavigateNext,
  draft,
  fieldErrors,
  fields,
  nextStep,
  navigationPending,
  packageVerification,
  title,
  onNavigateStep,
  onUpdateFields,
  onVerifyPackages,
}: {
  activeStep: DraftStep;
  canNavigateNext: boolean;
  draft: Draft;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  nextStep: DraftStep | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  title: string;
  onNavigateStep: (step: DraftStep) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onVerifyPackages: () => Promise<void>;
}) {
  const isPlaceholderStep = isWizardPlaceholderStep(activeStep);
  const panelAction =
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
    ) : null;

  return (
    <main className="min-w-0 space-y-5">
      <section>
        <div className="space-y-4">
          <WizardStepPanelHeader
            action={panelAction}
            draftId={draft.id}
            showDraftMeta={isPlaceholderStep}
            title={title}
          />
          <RegistrationStepScreen
            activeStep={activeStep}
            errors={fieldErrors}
            fields={fields}
            packageVerification={packageVerification}
            onUpdateFields={onUpdateFields}
            onVerifyPackages={onVerifyPackages}
          />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
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
        </dl>
      ) : null}
    </div>
  );
}
