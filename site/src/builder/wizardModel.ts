import {
  DRAFT_STEPS,
  parseDraftStep,
  type DraftStep,
  type DraftAutosaveStatus,
} from '@/storage/draftStorage';
import { isRegistrationDraftFieldStep } from './registrationDraftFields';

type WizardStepState = 'complete' | 'active' | 'available';

export type WizardStepItem = {
  step: DraftStep;
  label: string;
  state: WizardStepState;
};

const WIZARD_STEP_LABELS = {
  basics: 'Basics',
  about: 'About',
  discovery: 'Discovery',
  packages: 'Packages',
  media: 'Media',
  review: 'Review',
  publish: 'Publish',
} satisfies Record<DraftStep, string>;

const WIZARD_STATUS_LABELS = {
  idle: 'Saved',
  pending: 'Unsaved',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Save failed',
} satisfies Record<DraftAutosaveStatus, string>;

export function getWizardStepLabel(step: DraftStep): string {
  return WIZARD_STEP_LABELS[step];
}

export function createWizardStepItems(
  activeStep: DraftStep,
  completedSteps: readonly DraftStep[],
): WizardStepItem[] {
  const completedStepSet = new Set(completedSteps);

  return DRAFT_STEPS.map((step) => ({
    step,
    label: getWizardStepLabel(step),
    state: getWizardStepState(step, activeStep, completedStepSet),
  }));
}

export function resolveWizardRouteStep(
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

export function getWizardAdjacentStep(
  step: DraftStep,
  direction: 'previous' | 'next',
): DraftStep | null {
  const currentIndex = DRAFT_STEPS.indexOf(step);
  const nextIndex =
    direction === 'previous' ? currentIndex - 1 : currentIndex + 1;

  return DRAFT_STEPS[nextIndex] ?? null;
}

export function getWizardStatusLabel(
  status: DraftAutosaveStatus,
): string {
  return WIZARD_STATUS_LABELS[status];
}

export function isWizardPlaceholderStep(step: DraftStep): boolean {
  return !isRegistrationDraftFieldStep(step);
}

function getWizardStepState(
  step: DraftStep,
  activeStep: DraftStep,
  completedSteps: ReadonlySet<DraftStep>,
): WizardStepState {
  if (step === activeStep) return 'active';
  return completedSteps.has(step) ? 'complete' : 'available';
}
