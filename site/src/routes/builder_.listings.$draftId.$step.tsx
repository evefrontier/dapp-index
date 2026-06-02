import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  BuilderWizardMessage,
  BuilderWizardShell,
} from '@/builder/BuilderWizardShell';
import { resolveBuilderWizardRouteStep } from '@/builder/builderWizardModel';
import {
  createDraftAutosave,
  createDraftStorage,
  type Draft,
  type DraftAutosaveStatus,
  type DraftStep,
  type DraftStorage,
} from '@/storage/draftStorage';

export const Route = createFileRoute('/builder_/listings/$draftId/$step')({
  component: BuilderListingStepPage,
});

function BuilderListingStepPage() {
  const navigate = useNavigate();
  const { draftId, step } = Route.useParams();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] =
    useState<DraftAutosaveStatus>('idle');
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [navigationPending, setNavigationPending] = useState(false);
  const storedStep = draft?.currentStep ?? null;
  const autosave = useMemo(
    () =>
      createDraftAutosave({
        storage,
        draftId,
        onStatusChange: setAutosaveStatus,
      }),
    [draftId, storage],
  );
  const routeStep = useMemo(
    () =>
      storedStep ? resolveBuilderWizardRouteStep(step, storedStep) : null,
    [step, storedStep],
  );
  const autosaveError =
    autosaveStatus === 'error'
      ? getErrorMessage(autosave.getError(), 'Could not save draft.')
      : null;

  useEffect(() => {
    let canceled = false;

    async function loadDraft() {
      setLoading(true);
      setError(null);
      setNavigationError(null);
      try {
        const loadedDraft = await storage.getDraft(draftId);
        if (!canceled) setDraft(loadedDraft);
      } catch (caughtError) {
        if (!canceled) {
          setError(getErrorMessage(caughtError, 'Could not load draft.'));
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void loadDraft();

    return () => {
      canceled = true;
    };
  }, [draftId, storage]);

  useEffect(() => {
    setAutosaveStatus(autosave.getStatus());

    return () => {
      autosave.cancel();
    };
  }, [autosave]);

  useEffect(() => {
    if (!draft || !routeStep) return;

    if (routeStep.shouldRedirect) {
      void navigate({
        to: '/builder/listings/$draftId/$step',
        params: { draftId: draft.id, step: routeStep.step },
        replace: true,
      });
      return;
    }

    const routeDraftId = draft.id;
    const nextStep = routeStep.step;

    if (nextStep === draft.currentStep) return;

    let canceled = false;

    async function syncRouteStep() {
      setNavigationError(null);
      try {
        const updatedDraft = await storage.setDraftStep(routeDraftId, nextStep);
        if (!canceled) setDraft(updatedDraft);
      } catch (caughtError) {
        if (!canceled) {
          setNavigationError(
            getErrorMessage(caughtError, 'Could not open this step.'),
          );
        }
      }
    }

    void syncRouteStep();

    return () => {
      canceled = true;
    };
  }, [draft, navigate, routeStep, storage]);

  async function handleNavigateStep(nextStep: DraftStep) {
    if (!draft || navigationPending) return;

    setNavigationPending(true);
    setNavigationError(null);
    try {
      const savedDraft = await getSavedDraftBeforeNavigation();
      const updatedDraft =
        savedDraft.currentStep === nextStep
          ? savedDraft
          : await storage.setDraftStep(savedDraft.id, nextStep);

      await navigate({
        to: '/builder/listings/$draftId/$step',
        params: { draftId: updatedDraft.id, step: nextStep },
      });
      setDraft(updatedDraft);
    } catch (caughtError) {
      setNavigationError(
        getErrorMessage(caughtError, 'Could not save before navigation.'),
      );
    } finally {
      setNavigationPending(false);
    }
  }

  async function handleExitWizard() {
    if (!draft || navigationPending) return;

    setNavigationPending(true);
    setNavigationError(null);
    try {
      const savedDraft = await getSavedDraftBeforeNavigation();
      setDraft(savedDraft);
      await navigate({ to: '/builder' });
    } catch (caughtError) {
      setNavigationError(
        getErrorMessage(caughtError, 'Could not save before leaving.'),
      );
    } finally {
      setNavigationPending(false);
    }
  }

  async function getSavedDraftBeforeNavigation(): Promise<Draft> {
    const savedDraft = await autosave.flush();
    if (!savedDraft) {
      throw new Error('Draft not found.');
    }
    return savedDraft;
  }

  if (loading) {
    return (
      <BuilderWizardMessage title="Loading draft" body="Opening local draft." />
    );
  }

  if (error) {
    return <BuilderWizardMessage title="Draft error" body={error} />;
  }

  if (!draft) {
    return (
      <BuilderWizardMessage
        title="Draft not found"
        body="This local draft is not available in this browser."
      />
    );
  }

  if (!routeStep || routeStep.shouldRedirect) {
    return (
      <BuilderWizardMessage
        title="Opening step"
        body="Returning to the saved draft step."
      />
    );
  }

  return (
    <BuilderWizardShell
      activeStep={routeStep.step}
      autosaveError={autosaveError}
      autosaveStatus={autosaveStatus}
      draft={draft}
      navigationError={navigationError}
      navigationPending={navigationPending}
      onExitWizard={handleExitWizard}
      onNavigateStep={handleNavigateStep}
    />
  );
}

function getErrorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}
