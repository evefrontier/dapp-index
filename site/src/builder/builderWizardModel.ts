import {
  DRAFT_STEPS,
  parseDraftStep,
  type DraftStep,
  type DraftAutosaveStatus,
} from '@/storage/draftStorage';

type BuilderWizardStepState = 'complete' | 'active' | 'available';

export type BuilderWizardStepItem = {
  step: DraftStep;
  label: string;
  state: BuilderWizardStepState;
};

const BUILDER_WIZARD_STEP_LABELS = {
  basics: 'Basics',
  about: 'About',
  discovery: 'Discovery',
  packages: 'Packages',
  media: 'Media',
  proofs: 'Proofs',
  review: 'Review',
  publish: 'Publish',
} satisfies Record<DraftStep, string>;

const BUILDER_WIZARD_STATUS_LABELS = {
  idle: 'Saved',
  pending: 'Unsaved',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Save failed',
} satisfies Record<DraftAutosaveStatus, string>;

export function getBuilderWizardStepLabel(step: DraftStep): string {
  return BUILDER_WIZARD_STEP_LABELS[step];
}

export function createBuilderWizardStepItems(
  activeStep: DraftStep,
  completedSteps: readonly DraftStep[],
): BuilderWizardStepItem[] {
  const completedStepSet = new Set(completedSteps);

  return DRAFT_STEPS.map((step) => ({
    step,
    label: getBuilderWizardStepLabel(step),
    state: getBuilderWizardStepState(step, activeStep, completedStepSet),
  }));
}

export function resolveBuilderWizardRouteStep(
  routeStep: string,
  storedStep: DraftStep,
): {
  step: DraftStep;
  shouldRedirect: boolean;
} {
  const parsedStep = parseDraftStep(routeStep);

  return parsedStep
    ? { step: parsedStep, shouldRedirect: false }
    : { step: storedStep, shouldRedirect: true };
}

export function getBuilderWizardAdjacentStep(
  step: DraftStep,
  direction: 'previous' | 'next',
): DraftStep | null {
  const currentIndex = DRAFT_STEPS.indexOf(step);
  const nextIndex =
    direction === 'previous' ? currentIndex - 1 : currentIndex + 1;

  return DRAFT_STEPS[nextIndex] ?? null;
}

export function getBuilderWizardStatusLabel(
  status: DraftAutosaveStatus,
): string {
  return BUILDER_WIZARD_STATUS_LABELS[status];
}

function getBuilderWizardStepState(
  step: DraftStep,
  activeStep: DraftStep,
  completedSteps: ReadonlySet<DraftStep>,
): BuilderWizardStepState {
  if (step === activeStep) return 'active';
  return completedSteps.has(step) ? 'complete' : 'available';
}
