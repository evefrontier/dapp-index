import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import type {
  Draft,
  DraftAutosaveStatus,
  DraftStep,
} from '@/storage/draftStorage';
import {
  createBuilderWizardStepItems,
  getBuilderWizardAdjacentStep,
  getBuilderWizardStatusLabel,
  getBuilderWizardStepLabel,
  type BuilderWizardStepItem,
} from './builderWizardModel';

export type BuilderWizardShellProps = {
  activeStep: DraftStep;
  autosaveError: string | null;
  autosaveStatus: DraftAutosaveStatus;
  draft: Draft;
  navigationError: string | null;
  navigationPending: boolean;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
};

export function BuilderWizardShell({
  activeStep,
  autosaveError,
  autosaveStatus,
  draft,
  navigationError,
  navigationPending,
  onExitWizard,
  onNavigateStep,
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
          nextStep={nextStep}
          previousStep={previousStep}
          title={title}
          navigationPending={navigationPending}
          onExitWizard={onExitWizard}
          onNavigateStep={onNavigateStep}
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
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-neutral-70)]">{body}</p>
      </div>
      <Link
        to="/builder"
        className="text-sm font-bold uppercase text-[var(--color-primary)]"
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
        <p className="text-xs font-bold uppercase text-[var(--color-neutral-60)]">
          Listing wizard
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
          {title}
        </h1>
      </div>
      <div className="border border-[var(--color-neutral-20)] px-3 py-2 text-xs font-bold uppercase text-[var(--color-neutral-70)]">
        {statusLabel}
      </div>
    </div>
  );
}

function WizardErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      className="border border-[var(--color-error)] p-3 text-sm text-[var(--color-error)]"
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
  draft,
  nextStep,
  navigationPending,
  previousStep,
  title,
  onExitWizard,
  onNavigateStep,
}: {
  draft: Draft;
  nextStep: DraftStep | null;
  navigationPending: boolean;
  previousStep: DraftStep | null;
  title: string;
  onExitWizard: () => Promise<void>;
  onNavigateStep: (step: DraftStep) => Promise<void>;
}) {
  return (
    <main className="min-w-0 space-y-5">
      <section className="border border-[var(--color-neutral-20)] p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold uppercase text-[var(--color-foreground)]">
              {title}
            </h2>
            <p className="text-sm text-[var(--color-neutral-70)]">
              Screen content lands in the next builder PR.
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="font-bold uppercase text-[var(--color-neutral-60)]">
              Draft
            </dt>
            <dd className="break-all text-[var(--color-foreground)]">
              {draft.id}
            </dd>
            <dt className="font-bold uppercase text-[var(--color-neutral-60)]">
              Step
            </dt>
            <dd className="text-[var(--color-foreground)]">{title}</dd>
          </dl>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="text-sm font-bold uppercase text-[var(--color-primary)]"
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
            disabled={navigationPending || !nextStep}
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

function getStepButtonClassName(item: BuilderWizardStepItem): string {
  const baseClassName =
    'flex w-full items-center justify-between gap-3 border px-3 py-2 text-left text-sm font-bold uppercase transition-colors disabled:cursor-default';

  if (item.state === 'active') {
    return `${baseClassName} border-[var(--color-primary)] text-[var(--color-foreground)]`;
  }

  if (item.state === 'complete') {
    return `${baseClassName} border-[var(--color-neutral-20)] text-[var(--color-primary)] hover:border-[var(--color-primary)]`;
  }

  return `${baseClassName} border-[var(--color-neutral-20)] text-[var(--color-neutral-70)] hover:border-[var(--color-neutral-50)]`;
}

function StepStateLabel({ item }: { item: BuilderWizardStepItem }) {
  if (item.state === 'available') return null;

  const label = item.state === 'active' ? 'Now' : 'Done';

  return <span className="text-[0.6875rem]">{label}</span>;
}
