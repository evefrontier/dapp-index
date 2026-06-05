import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { verifyMoveRegistryPackage } from '@/chain/moveRegistry';
import { createMoveRegistryResolver } from '@/chain/moveRegistryResolver';
import type { BuilderWizardShellProps } from './BuilderWizardShell';
import { getBuilderErrorMessage } from './builderErrors';
import { resolveBuilderWizardRouteStep } from './builderWizardModel';
import { createRegistrationDraftMediaUploadInput } from './registrationDraftMedia';
import {
  createRegistrationDraftFieldPatch,
  createRegistrationDraftFields,
  readRegistrationDraftFields,
  validateRegistrationDraftFields,
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
  type DraftMediaUpdate,
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

export function useBuilderListingStepController({
  draftId,
  step,
}: BuilderListingStepControllerOptions): BuilderListingStepController {
  const navigate = useNavigate();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] =
    useState<DraftAutosaveStatus>('idle');
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [navigationPending, setNavigationPending] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaPending, setMediaPending] = useState(false);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<
    Record<string, string>
  >({});
  const [packageVerification, setPackageVerification] =
    useState<RegistrationDraftPackageVerificationState>(
      INITIAL_REGISTRATION_DRAFT_PACKAGE_VERIFICATION,
    );
  const loadedDraftId = draft?.id ?? null;
  const draftMedia = draft?.media ?? [];
  const storedStep = draft?.currentStep ?? null;
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
  const routeStep = useMemo(
    () =>
      storedStep ? resolveBuilderWizardRouteStep(step, storedStep) : null,
    [step, storedStep],
  );
  const autosave = useMemo(
    () =>
      createDraftAutosave({
        storage,
        draftId,
        onStatusChange: setAutosaveStatus,
      }),
    [draftId, storage],
  );
  const moveRegistryResolver = useMemo(() => createMoveRegistryResolver(), []);
  const autosaveError =
    autosaveStatus === 'error'
      ? getBuilderErrorMessage(autosave.getError(), 'Could not save draft.')
      : null;

  useEffect(() => {
    let canceled = false;

    async function loadDraft() {
      setLoading(true);
      setError(null);
      setMediaError(null);
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
  }, [draftId, storage]);

  useEffect(() => {
    let canceled = false;
    const objectUrls: string[] = [];

    async function loadMediaPreviews() {
      if (!loadedDraftId || draftMedia.length === 0) {
        setMediaPreviewUrls((currentUrls) => {
          revokeObjectUrls(currentUrls);
          return {};
        });
        return;
      }

      try {
        const previewEntries = await Promise.all(
          draftMedia.map(async (media) => {
            const content = await storage.getLocalMedia(loadedDraftId, media.id);
            if (!content) return null;

            const url = URL.createObjectURL(content);
            objectUrls.push(url);
            return [media.id, url] as const;
          }),
        );

        if (canceled) {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        setMediaPreviewUrls((currentUrls) => {
          revokeObjectUrls(currentUrls);
          return Object.fromEntries(previewEntries.filter(isPreviewEntry));
        });
      } catch (caughtError) {
        if (!canceled) {
          setMediaError(
            getBuilderErrorMessage(
              caughtError,
              'Could not load local media previews.',
            ),
          );
        }
      }
    }

    void loadMediaPreviews();

    return () => {
      canceled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [draftMedia, loadedDraftId, storage]);

  useEffect(() => {
    setAutosaveStatus(autosave.getStatus());

    return () => {
      autosave.cancel();
    };
  }, [autosave]);

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
  }, [loadedDraftId, navigate, routeStep, storage, storedStep]);

  const getSavedDraftBeforeNavigation = useCallback(async (): Promise<Draft> => {
    const savedDraft = await autosave.flush();
    if (!savedDraft) {
      throw new Error('Draft not found.');
    }
    return savedDraft;
  }, [autosave]);

  const handleUpdateFields = useCallback(
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
    [autosave],
  );

  const handleVerifyPackages = useCallback(async () => {
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
  }, [fields.suiPackages, moveRegistryResolver]);

  const refreshLoadedDraft = useCallback(async () => {
    if (!loadedDraftId) return;

    const refreshedDraft = await storage.getDraft(loadedDraftId);
    setDraft(refreshedDraft);
  }, [loadedDraftId, storage]);

  const handleUploadMedia = useCallback(
    async (files: File[]) => {
      if (!loadedDraftId || files.length === 0 || mediaPending) return;

      setMediaPending(true);
      setMediaError(null);
      try {
        const mediaIds = draftMedia.map((media) => media.id);
        for (const file of files) {
          const uploadInput = createRegistrationDraftMediaUploadInput(
            file,
            mediaIds,
          );
          if (!uploadInput.ok) {
            throw new Error(`${file.name}: ${uploadInput.errorMessage}`);
          }

          await storage.saveMedia(loadedDraftId, uploadInput.input, file);
          mediaIds.push(uploadInput.input.id);
        }

        await refreshLoadedDraft();
      } catch (caughtError) {
        setMediaError(
          getBuilderErrorMessage(caughtError, 'Could not save local media.'),
        );
        try {
          await refreshLoadedDraft();
        } catch {
          // Keep the original media error visible.
        }
      } finally {
        setMediaPending(false);
      }
    },
    [
      draftMedia,
      loadedDraftId,
      mediaPending,
      refreshLoadedDraft,
      storage,
    ],
  );

  const handleUpdateMedia = useCallback(
    async (mediaId: string, update: DraftMediaUpdate) => {
      if (!loadedDraftId) return;

      setMediaError(null);
      try {
        const updatedDraft = await storage.updateMedia(
          loadedDraftId,
          mediaId,
          update,
        );
        setDraft(updatedDraft);
      } catch (caughtError) {
        setMediaError(
          getBuilderErrorMessage(caughtError, 'Could not update media.'),
        );
      }
    },
    [loadedDraftId, storage],
  );

  const handleDeleteMedia = useCallback(
    async (mediaId: string) => {
      if (!loadedDraftId || mediaPending) return;

      setMediaPending(true);
      setMediaError(null);
      try {
        const updatedDraft = await storage.deleteMedia(loadedDraftId, mediaId);
        setDraft(updatedDraft);
      } catch (caughtError) {
        setMediaError(
          getBuilderErrorMessage(caughtError, 'Could not remove media.'),
        );
      } finally {
        setMediaPending(false);
      }
    },
    [loadedDraftId, mediaPending, storage],
  );

  const handleNavigateStep = useCallback(
    async (nextStep: DraftStep) => {
      if (!loadedDraftId || navigationPending) return;

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
          getBuilderErrorMessage(
            caughtError,
            'Could not save before navigation.',
          ),
        );
      } finally {
        setNavigationPending(false);
      }
    },
    [
      getSavedDraftBeforeNavigation,
      navigate,
      loadedDraftId,
      navigationPending,
      storage,
    ],
  );

  const handleExitWizard = useCallback(async () => {
    if (!loadedDraftId || navigationPending) return;

    setNavigationPending(true);
    setNavigationError(null);
    try {
      const savedDraft = await getSavedDraftBeforeNavigation();
      setDraft(savedDraft);
      await navigate({ to: '/builder' });
    } catch (caughtError) {
      setNavigationError(
        getBuilderErrorMessage(caughtError, 'Could not save before leaving.'),
      );
    } finally {
      setNavigationPending(false);
    }
  }, [
    getSavedDraftBeforeNavigation,
    loadedDraftId,
    navigate,
    navigationPending,
  ]);

  if (loading) {
    return {
      kind: 'message',
      title: 'Loading draft',
      body: 'Opening local draft.',
    };
  }

  if (error) {
    return {
      kind: 'message',
      title: 'Draft error',
      body: error,
    };
  }

  if (!draft) {
    return {
      kind: 'message',
      title: 'Draft not found',
      body: 'This local draft is not available in this browser.',
    };
  }

  if (!routeStep || routeStep.shouldRedirect) {
    return {
      kind: 'message',
      title: 'Opening step',
      body: 'Returning to the saved draft step.',
    };
  }

  return {
    kind: 'ready',
    shellProps: {
      activeStep: routeStep.step,
      autosaveError,
      autosaveStatus,
      draft,
      fieldErrors,
      fields,
      mediaError,
      mediaPending,
      mediaPreviewUrls,
      navigationError,
      navigationPending,
      packageVerification,
      onDeleteMedia: handleDeleteMedia,
      onExitWizard: handleExitWizard,
      onNavigateStep: handleNavigateStep,
      onUpdateMedia: handleUpdateMedia,
      onUpdateFields: handleUpdateFields,
      onUploadMedia: handleUploadMedia,
      onVerifyPackages: handleVerifyPackages,
    },
  };
}

function revokeObjectUrls(urls: Record<string, string>): void {
  Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
}

function isPreviewEntry(
  value: readonly [string, string] | null,
): value is readonly [string, string] {
  return value !== null;
}
