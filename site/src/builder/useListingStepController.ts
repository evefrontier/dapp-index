import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { verifyMoveRegistryPackage } from '@/chain/moveRegistry';
import { createMoveRegistryResolver } from '@/chain/moveRegistryResolver';
import type { WizardShellProps } from './WizardShell';
import { getErrorMessage } from './errors';
import {
  replaceRegistrationDraftMediaForSlot,
  validateRegistrationDraftMediaUploadForSlot,
  validateRegistrationDraftMediaStep,
} from './registrationDraftMedia';
import type { MediaSlotId } from './mediaSlotModel';
import { getMediaForSlot } from './mediaSlotModel';
import { resolveWizardRouteStep } from './wizardModel';
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
import { createPublishStepState } from './publishStepPresentation';
import type { ReviewStepControllerState } from './reviewStepPresentation';
import { isPublishedDraft } from './publishedDraft';
import { useRegistrationDraftReview } from './useRegistrationDraftReview';
import { useRegistrationDraftSlugCheck } from './useRegistrationDraftSlugCheck';
import {
  useRegistrationDraftPublishController,
} from './useRegistrationDraftPublishController';
import {
  createDraftAutosave,
  createDraftStorage,
  type Draft,
  type DraftAutosaveStatus,
  type DraftMediaUpdate,
  type DraftStep,
  type DraftStorage,
} from '@/storage/draftStorage';

export type ListingStepController =
  | {
      kind: 'message';
      title: string;
      body: string;
    }
  | {
      kind: 'ready';
      shellProps: WizardShellProps;
    };

export type ListingStepControllerOptions = {
  draftId: string;
  step: string;
};

type ListingStepMessage = Extract<
  ListingStepController,
  { kind: 'message' }
>;
type WizardNavigate = ReturnType<typeof useNavigate>;
type WizardRouteStep = ReturnType<typeof resolveWizardRouteStep>;
type DraftAutosave = ReturnType<typeof createDraftAutosave>;
const EMPTY_DRAFT_MEDIA: Draft['media'] = [];

type ListingStepState = {
  draft: Draft | null;
  error: string | null;
  loading: boolean;
  routeStep: WizardRouteStep | null;
};

type ListingStepReadyState = ListingStepState & {
  draft: Draft;
  error: null;
  routeStep: WizardRouteStep;
};

type ListingStepResultOptions = ListingStepState & {
  autosaveError: string | null;
  autosaveStatus: DraftAutosaveStatus;
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  mediaError: string | null;
  mediaErrors: ReturnType<typeof validateRegistrationDraftMediaStep>['errors'];
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  navigationError: string | null;
  navigationPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  publishStep: ReturnType<typeof createPublishStepState>;
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

export function useListingStepController({
  draftId,
  step,
}: ListingStepControllerOptions): ListingStepController {
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
  const { metadataHashPreview, review } = useRegistrationDraftReview(fields);
  const { slugCheck, onCheckSlug } = useRegistrationDraftSlugCheck(fields.slug);
  const reviewStep = useMemo(
    () => ({
      metadataHashPreview,
      onCheckSlug,
      review,
      slugCheck,
    }),
    [metadataHashPreview, onCheckSlug, review, slugCheck],
  );
  const mediaErrors = useMemo(
    () => validateRegistrationDraftMediaStep(draft?.media ?? []).errors,
    [draft?.media],
  );
  const moveRegistryResolver = useMemo(() => createMoveRegistryResolver(), []);
  const { loadedDraftId, routeStep } = useRouteStepSync({
    draft,
    navigate,
    setDraft,
    setNavigationError,
    step,
    storage,
  });
  const {
    mediaError,
    mediaPending,
    mediaPreviewUrls,
    onDeleteMedia,
    onUpdateMedia,
    onUploadMediaForSlot,
  } = useLocalMediaController({
    draftMedia: draft?.media ?? EMPTY_DRAFT_MEDIA,
    loadedDraftId,
    setDraft,
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
  const {
    publishReadiness,
    publishState,
    suiNetwork,
    walletAddress,
    walletBalanceStatus,
    walletNetwork,
    onConnectWallet,
    onPublish,
  } = useRegistrationDraftPublishController({
    autosave,
    draft,
    fields,
    review,
    setDraft,
    storage,
  });
  const publishStep = useMemo(
    () =>
      createPublishStepState(
        {
          publishReadiness,
          publishState,
          suiNetwork,
          walletAddress,
          walletBalanceStatus,
          walletNetwork,
          onConnectWallet,
          onPublish,
        },
        draft?.media.length ?? 0,
      ),
    [
      draft?.media.length,
      onConnectWallet,
      onPublish,
      publishReadiness,
      publishState,
      suiNetwork,
      walletAddress,
      walletBalanceStatus,
      walletNetwork,
    ],
  );

  const readOnly = draft ? isPublishedDraft(draft) : false;
  const guarded = useReadOnlyGuardedHandlers({
    readOnly,
    onDeleteMedia,
    onUpdateFields,
    onUpdateMedia,
    onUploadMediaForSlot,
    onVerifyPackages,
  });

  return createListingStepControllerResult({
    autosaveError,
    autosaveStatus,
    draft,
    error,
    fieldErrors,
    fields,
    loading,
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
    onDeleteMedia: guarded.onDeleteMedia,
    onExitWizard,
    onNavigateStep,
    onUpdateMedia: guarded.onUpdateMedia,
    onUpdateFields: guarded.onUpdateFields,
    onUploadMediaForSlot: guarded.onUploadMediaForSlot,
    onVerifyPackages: guarded.onVerifyPackages,
    routeStep,
  });
}

function useReadOnlyGuardedHandlers({
  readOnly,
  onDeleteMedia,
  onUpdateFields,
  onUpdateMedia,
  onUploadMediaForSlot,
  onVerifyPackages,
}: {
  readOnly: boolean;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUploadMediaForSlot: (slotId: MediaSlotId, file: File) => Promise<void>;
  onVerifyPackages: () => Promise<void>;
}) {
  const guardedOnUpdateFields = useCallback(
    (nextFields: Partial<RegistrationDraftFields>) => {
      if (readOnly) return;
      onUpdateFields(nextFields);
    },
    [onUpdateFields, readOnly],
  );
  const guardedOnUploadMediaForSlot = useCallback(
    async (slotId: MediaSlotId, file: File) => {
      if (readOnly) return;
      await onUploadMediaForSlot(slotId, file);
    },
    [onUploadMediaForSlot, readOnly],
  );
  const guardedOnUpdateMedia = useCallback(
    async (mediaId: string, update: DraftMediaUpdate) => {
      if (readOnly) return;
      await onUpdateMedia(mediaId, update);
    },
    [onUpdateMedia, readOnly],
  );
  const guardedOnDeleteMedia = useCallback(
    async (mediaId: string) => {
      if (readOnly) return;
      await onDeleteMedia(mediaId);
    },
    [onDeleteMedia, readOnly],
  );
  const guardedOnVerifyPackages = useCallback(async () => {
    if (readOnly) return;
    await onVerifyPackages();
  }, [onVerifyPackages, readOnly]);

  return {
    onDeleteMedia: guardedOnDeleteMedia,
    onUpdateFields: guardedOnUpdateFields,
    onUpdateMedia: guardedOnUpdateMedia,
    onUploadMediaForSlot: guardedOnUploadMediaForSlot,
    onVerifyPackages: guardedOnVerifyPackages,
  };
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
            getErrorMessage(caughtError, 'Could not load draft.'),
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
      ? getErrorMessage(autosave.getError(), 'Could not save draft.')
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
  navigate: WizardNavigate;
  setDraft: (draft: Draft | null) => void;
  setNavigationError: (message: string | null) => void;
  step: string;
  storage: DraftStorage;
}) {
  const loadedDraftId = draft?.id ?? null;
  const storedStep = draft?.currentStep ?? null;
  const routeStep = useMemo(
    () =>
      storedStep ? resolveWizardRouteStep(step, storedStep) : null,
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
            getErrorMessage(caughtError, 'Could not open this step.'),
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
        errorMessage: getErrorMessage(
          caughtError,
          'Could not check MVR match.',
        ),
      });
    }
  }, [fields.suiPackages, moveRegistryResolver, setPackageVerification]);
}

function useLocalMediaController({
  draftMedia,
  loadedDraftId,
  setDraft,
  storage,
}: {
  draftMedia: Draft['media'];
  loadedDraftId: string | null;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  storage: DraftStorage;
}) {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaPending, setMediaPending] = useState(false);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setMediaError(null);
  }, [loadedDraftId]);

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
            getErrorMessage(
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

  const refreshLoadedDraft = useCallback(async () => {
    if (!loadedDraftId) return;

    const refreshedDraft = await storage.getDraft(loadedDraftId);
    setDraft(refreshedDraft);
  }, [loadedDraftId, setDraft, storage]);

  const onUploadMediaForSlot = useCallback(
    async (slotId: MediaSlotId, file: File) => {
      if (!loadedDraftId || mediaPending) return;

      const existingItem = getMediaForSlot(draftMedia, slotId);
      const limitsValidation = validateRegistrationDraftMediaUploadForSlot(
        slotId,
        draftMedia,
        file,
        { replacing: Boolean(existingItem) },
      );
      if (!limitsValidation.ok) {
        setMediaError(limitsValidation.errorMessage);
        return;
      }

      setMediaPending(true);
      setMediaError(null);
      try {
        await replaceRegistrationDraftMediaForSlot(
          storage,
          loadedDraftId,
          slotId,
          file,
          limitsValidation.mimeType,
        );
        await refreshLoadedDraft();
      } catch (caughtError) {
        setMediaError(
          getErrorMessage(caughtError, 'Could not save local media.'),
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

  const onUpdateMedia = useCallback(
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
          getErrorMessage(caughtError, 'Could not update media.'),
        );
      }
    },
    [loadedDraftId, setDraft, storage],
  );

  const onDeleteMedia = useCallback(
    async (mediaId: string) => {
      if (!loadedDraftId || mediaPending) return;

      setMediaPending(true);
      setMediaError(null);
      try {
        const updatedDraft = await storage.deleteMedia(loadedDraftId, mediaId);
        setDraft(updatedDraft);
      } catch (caughtError) {
        setMediaError(
          getErrorMessage(caughtError, 'Could not remove media.'),
        );
      } finally {
        setMediaPending(false);
      }
    },
    [loadedDraftId, mediaPending, setDraft, storage],
  );

  return {
    mediaError,
    mediaPending,
    mediaPreviewUrls,
    onDeleteMedia,
    onUpdateMedia,
    onUploadMediaForSlot,
  };
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
  navigate: WizardNavigate;
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
        setNavigationError(getErrorMessage(caughtError, fallbackMessage));
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

function createListingStepControllerResult(
  options: ListingStepResultOptions,
): ListingStepController {
  if (!isListingStepReady(options)) {
    return getListingStepMessage(options);
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
      mediaError: options.mediaError,
      mediaErrors: options.mediaErrors,
      mediaPending: options.mediaPending,
      mediaPreviewUrls: options.mediaPreviewUrls,
      navigationError: options.navigationError,
      navigationPending: options.navigationPending,
      packageVerification: options.packageVerification,
      publishStep: options.publishStep,
      readOnly: options.readOnly,
      reviewStep: options.reviewStep,
      onDeleteMedia: options.onDeleteMedia,
      onExitWizard: options.onExitWizard,
      onNavigateStep: options.onNavigateStep,
      onUpdateMedia: options.onUpdateMedia,
      onUpdateFields: options.onUpdateFields,
      onUploadMediaForSlot: options.onUploadMediaForSlot,
      onVerifyPackages: options.onVerifyPackages,
    },
  };
}

function isListingStepReady(
  state: ListingStepState,
): state is ListingStepReadyState {
  return (
    !state.loading &&
    state.error === null &&
    state.draft !== null &&
    state.routeStep !== null &&
    !state.routeStep.shouldRedirect
  );
}

function getListingStepMessage(
  state: ListingStepState,
): ListingStepMessage {
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

function revokeObjectUrls(urls: Record<string, string>): void {
  Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
}

function isPreviewEntry(
  value: readonly [string, string] | null,
): value is readonly [string, string] {
  return value !== null;
}
