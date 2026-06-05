import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { verifyMoveRegistryPackage } from '@/chain/moveRegistry';
import { createMoveRegistryResolver } from '@/chain/moveRegistryResolver';
import type { BuilderWizardShellProps } from './BuilderWizardShell';
import { getBuilderErrorMessage } from './builderErrors';
import { resolveBuilderWizardRouteStep } from './builderWizardModel';
import {
  createRegistrationDraftFieldPatch,
  createRegistrationDraftFields,
  readRegistrationDraftFields,
  validateRegistrationDraftFields,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFields,
} from './registrationDraftFields';
import {
  getRegistrationDraftPackageVerificationBlocker,
  INITIAL_REGISTRATION_DRAFT_PACKAGE_VERIFICATION,
  toMoveRegistryResolvablePackages,
  type RegistrationDraftPackageVerificationState,
} from './registrationDraftPackages';
import {
  createDraftAutosave,
  createDraftStorage,
  type Draft,
  type DraftAutosaveStatus,
  type DraftStep,
  type DraftStorage,
} from '@/storage/draftStorage';

export type BuilderListingStepController =
  | {
      kind: 'message';
      title: string;
      body: string;
    }
  | {
      kind: 'ready';
      shellProps: BuilderWizardShellProps;
    };

export type BuilderListingStepControllerOptions = {
  draftId: string;
  step: string;
};

type BuilderListingStepMessage = Extract<
  BuilderListingStepController,
  { kind: 'message' }
>;
type BuilderNavigate = ReturnType<typeof useNavigate>;
type BuilderWizardRouteStep = ReturnType<typeof resolveBuilderWizardRouteStep>;
type DraftAutosave = ReturnType<typeof createDraftAutosave>;

type BuilderListingStepState = {
  draft: Draft | null;
  error: string | null;
  loading: boolean;
  routeStep: BuilderWizardRouteStep | null;
};

type BuilderListingStepReadyState = BuilderListingStepState & {
  draft: Draft;
  error: null;
  routeStep: BuilderWizardRouteStep;
};

type BuilderListingStepResultOptions = BuilderListingStepState & {
  autosaveError: string | null;
  autosaveStatus: DraftAutosaveStatus;
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

export function useBuilderListingStepController({
  draftId,
  step,
}: BuilderListingStepControllerOptions): BuilderListingStepController {
  const navigate = useNavigate();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [navigationPending, setNavigationPending] = useState(false);
  const [packageVerification, setPackageVerification] =
    useState<RegistrationDraftPackageVerificationState>(
      INITIAL_REGISTRATION_DRAFT_PACKAGE_VERIFICATION,
    );
  const { draft, setDraft, loading, error } = useDraftLoader({
    draftId,
    storage,
    setNavigationError,
  });
  const { autosave, autosaveError, autosaveStatus, setAutosaveStatus } =
    useDraftAutosaveController(storage, draftId);
  const { fields, fieldErrors } = useRegistrationDraftFields(draft);
  const moveRegistryResolver = useMemo(() => createMoveRegistryResolver(), []);
  const { loadedDraftId, routeStep } = useRouteStepSync({
    draft,
    navigate,
    setDraft,
    setNavigationError,
    step,
    storage,
  });
  const onUpdateFields = useUpdateRegistrationDraftFields({
    autosave,
    setAutosaveStatus,
    setDraft,
    setPackageVerification,
  });
  const onVerifyPackages = useVerifyRegistrationDraftPackages({
    fields,
    moveRegistryResolver,
    setPackageVerification,
  });
  const { onExitWizard, onNavigateStep } = useWizardNavigation({
    autosave,
    loadedDraftId,
    navigate,
    navigationPending,
    setDraft,
    setNavigationError,
    setNavigationPending,
    storage,
  });

  return createBuilderListingStepControllerResult({
    autosaveError,
    autosaveStatus,
    draft,
    error,
    fieldErrors,
    fields,
    loading,
    navigationError,
    navigationPending,
    packageVerification,
    onExitWizard,
    onNavigateStep,
    onUpdateFields,
    onVerifyPackages,
    routeStep,
  });
}

function useDraftLoader({
  draftId,
  storage,
  setNavigationError,
}: {
  draftId: string;
  storage: DraftStorage;
  setNavigationError: (message: string | null) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(
            getBuilderErrorMessage(caughtError, 'Could not load draft.'),
          );
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    void loadDraft();

    return () => {
      canceled = true;
    };
  }, [draftId, setNavigationError, storage]);

  return {
    draft,
    error,
    loading,
    setDraft,
  };
}

function useDraftAutosaveController(
  storage: DraftStorage,
  draftId: string,
) {
  const isMounted = useRef(true);
  const [autosaveStatus, setAutosaveStatus] =
    useState<DraftAutosaveStatus>('idle');
  const autosave = useMemo(
    () =>
      createDraftAutosave({
        storage,
        draftId,
        onStatusChange: (status) => {
          if (isMounted.current) setAutosaveStatus(status);
        },
      }),
    [draftId, storage],
  );
  const autosaveError =
    autosaveStatus === 'error'
      ? getBuilderErrorMessage(autosave.getError(), 'Could not save draft.')
      : null;

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setAutosaveStatus(autosave.getStatus());

    return () => {
      autosave.cancel();
    };
  }, [autosave]);

  return {
    autosave,
    autosaveError,
    autosaveStatus,
    setAutosaveStatus,
  };
}

function useRegistrationDraftFields(draft: Draft | null) {
  const fields = useMemo(
    () =>
      draft
        ? readRegistrationDraftFields(draft.fields)
        : createRegistrationDraftFields(),
    [draft],
  );
  const fieldErrors = useMemo(
    () => validateRegistrationDraftFields(fields),
    [fields],
  );

  return {
    fieldErrors,
    fields,
  };
}

function useRouteStepSync({
  draft,
  navigate,
  setDraft,
  setNavigationError,
  step,
  storage,
}: {
  draft: Draft | null;
  navigate: BuilderNavigate;
  setDraft: (draft: Draft | null) => void;
  setNavigationError: (message: string | null) => void;
  step: string;
  storage: DraftStorage;
}) {
  const loadedDraftId = draft?.id ?? null;
  const storedStep = draft?.currentStep ?? null;
  const routeStep = useMemo(
    () =>
      storedStep ? resolveBuilderWizardRouteStep(step, storedStep) : null,
    [step, storedStep],
  );

  useEffect(() => {
    if (!loadedDraftId || !storedStep || !routeStep) return;

    if (routeStep.shouldRedirect) {
      void navigate({
        to: '/builder/listings/$draftId/$step',
        params: { draftId: loadedDraftId, step: routeStep.step },
        replace: true,
      });
      return;
    }

    const routeDraftId = loadedDraftId;
    const nextStep = routeStep.step;

    if (nextStep === storedStep) return;

    let canceled = false;

    async function syncRouteStep() {
      setNavigationError(null);
      try {
        const updatedDraft = await storage.setDraftStep(routeDraftId, nextStep);
        if (!canceled) setDraft(updatedDraft);
      } catch (caughtError) {
        if (!canceled) {
          setNavigationError(
            getBuilderErrorMessage(caughtError, 'Could not open this step.'),
          );
        }
      }
    }

    void syncRouteStep();

    return () => {
      canceled = true;
    };
  }, [
    loadedDraftId,
    navigate,
    routeStep,
    setDraft,
    setNavigationError,
    storage,
    storedStep,
  ]);

  return {
    loadedDraftId,
    routeStep,
  };
}

function useUpdateRegistrationDraftFields({
  autosave,
  setAutosaveStatus,
  setDraft,
  setPackageVerification,
}: {
  autosave: DraftAutosave;
  setAutosaveStatus: (status: DraftAutosaveStatus) => void;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  setPackageVerification: Dispatch<
    SetStateAction<RegistrationDraftPackageVerificationState>
  >;
}) {
  return useCallback(
    (nextFields: Partial<RegistrationDraftFields>) => {
      const fieldPatch = createRegistrationDraftFieldPatch(nextFields);

      autosave.updateFields(fieldPatch);
      setAutosaveStatus(autosave.getStatus());
      if (Object.hasOwn(nextFields, 'suiPackages')) {
        setPackageVerification(INITIAL_REGISTRATION_DRAFT_PACKAGE_VERIFICATION);
      }
      setDraft((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              fields: {
                ...currentDraft.fields,
                ...fieldPatch,
              },
            }
          : currentDraft,
      );
    },
    [autosave, setAutosaveStatus, setDraft, setPackageVerification],
  );
}

function useVerifyRegistrationDraftPackages({
  fields,
  moveRegistryResolver,
  setPackageVerification,
}: {
  fields: RegistrationDraftFields;
  moveRegistryResolver: ReturnType<typeof createMoveRegistryResolver>;
  setPackageVerification: Dispatch<
    SetStateAction<RegistrationDraftPackageVerificationState>
  >;
}) {
  return useCallback(async () => {
    const verificationBlocker = getRegistrationDraftPackageVerificationBlocker(
      fields.suiPackages,
    );
    if (verificationBlocker) {
      setPackageVerification({
        status: 'error',
        result: null,
        errorMessage: verificationBlocker,
      });
      return;
    }

    setPackageVerification({
      status: 'verifying',
      result: null,
      errorMessage: null,
    });

    try {
      const results = await Promise.all(
        toMoveRegistryResolvablePackages(fields.suiPackages).map(
          (entry) => verifyMoveRegistryPackage(entry, moveRegistryResolver),
        ),
      );
      const ok = results.every((result) => result.status === 'verified');

      setPackageVerification({
        status: ok ? 'ready' : 'not-ready',
        result: { ok, results },
        errorMessage: null,
      });
    } catch (caughtError) {
      setPackageVerification({
        status: 'error',
        result: null,
        errorMessage: getBuilderErrorMessage(
          caughtError,
          'Could not verify packages.',
        ),
      });
    }
  }, [fields.suiPackages, moveRegistryResolver, setPackageVerification]);
}

function useWizardNavigation({
  autosave,
  loadedDraftId,
  navigate,
  navigationPending,
  setDraft,
  setNavigationError,
  setNavigationPending,
  storage,
}: {
  autosave: DraftAutosave;
  loadedDraftId: string | null;
  navigate: BuilderNavigate;
  navigationPending: boolean;
  setDraft: (draft: Draft | null) => void;
  setNavigationError: (message: string | null) => void;
  setNavigationPending: (pending: boolean) => void;
  storage: DraftStorage;
}) {
  const getSavedDraftBeforeNavigation = useCallback(async (): Promise<Draft> => {
    const savedDraft = await autosave.flush();
    if (!savedDraft) {
      throw new Error('Draft not found.');
    }
    return savedDraft;
  }, [autosave]);

  const runWizardNavigation = useCallback(
    async (
      navigateWithSavedDraft: (savedDraft: Draft) => Promise<void>,
      fallbackMessage: string,
    ) => {
      setNavigationPending(true);
      setNavigationError(null);
      try {
        const savedDraft = await getSavedDraftBeforeNavigation();
        await navigateWithSavedDraft(savedDraft);
      } catch (caughtError) {
        setNavigationError(getBuilderErrorMessage(caughtError, fallbackMessage));
      } finally {
        setNavigationPending(false);
      }
    },
    [
      getSavedDraftBeforeNavigation,
      setNavigationError,
      setNavigationPending,
    ],
  );

  const onNavigateStep = useCallback(
    async (nextStep: DraftStep) => {
      if (!loadedDraftId || navigationPending) return;

      await runWizardNavigation(async (savedDraft) => {
        const updatedDraft =
          savedDraft.currentStep === nextStep
            ? savedDraft
            : await storage.setDraftStep(savedDraft.id, nextStep);

        await navigate({
          to: '/builder/listings/$draftId/$step',
          params: { draftId: updatedDraft.id, step: nextStep },
        });
        setDraft(updatedDraft);
      }, 'Could not save before navigation.');
    },
    [
      loadedDraftId,
      navigate,
      navigationPending,
      runWizardNavigation,
      setDraft,
      storage,
    ],
  );

  const onExitWizard = useCallback(async () => {
    if (!loadedDraftId || navigationPending) return;

    await runWizardNavigation(async (savedDraft) => {
      setDraft(savedDraft);
      await navigate({ to: '/builder' });
    }, 'Could not save before leaving.');
  }, [
    loadedDraftId,
    navigate,
    navigationPending,
    runWizardNavigation,
    setDraft,
  ]);

  return {
    onExitWizard,
    onNavigateStep,
  };
}

function createBuilderListingStepControllerResult(
  options: BuilderListingStepResultOptions,
): BuilderListingStepController {
  if (!isBuilderListingStepReady(options)) {
    return getBuilderListingStepMessage(options);
  }

  return {
    kind: 'ready',
    shellProps: {
      activeStep: options.routeStep.step,
      autosaveError: options.autosaveError,
      autosaveStatus: options.autosaveStatus,
      draft: options.draft,
      fieldErrors: options.fieldErrors,
      fields: options.fields,
      navigationError: options.navigationError,
      navigationPending: options.navigationPending,
      packageVerification: options.packageVerification,
      onExitWizard: options.onExitWizard,
      onNavigateStep: options.onNavigateStep,
      onUpdateFields: options.onUpdateFields,
      onVerifyPackages: options.onVerifyPackages,
    },
  };
}

function isBuilderListingStepReady(
  state: BuilderListingStepState,
): state is BuilderListingStepReadyState {
  return (
    !state.loading &&
    state.error === null &&
    state.draft !== null &&
    state.routeStep !== null &&
    !state.routeStep.shouldRedirect
  );
}

function getBuilderListingStepMessage(
  state: BuilderListingStepState,
): BuilderListingStepMessage {
  if (state.loading) {
    return {
      kind: 'message',
      title: 'Loading draft',
      body: 'Opening local draft.',
    };
  }

  if (state.error) {
    return {
      kind: 'message',
      title: 'Draft error',
      body: state.error,
    };
  }

  if (!state.draft) {
    return {
      kind: 'message',
      title: 'Draft not found',
      body: 'This local draft is not available in this browser.',
    };
  }

  return {
    kind: 'message',
    title: 'Opening step',
    body: 'Returning to the saved draft step.',
  };
}
