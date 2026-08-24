import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HomeViewProps } from './HomeView';
import { getErrorMessage } from './errors';
import { createHomeDraftItem } from './homeModel';
import { createRegistrationDraft } from './registrationDraft';
import { tutorialPreference } from './tutorialStorage';
import {
  createDraftStorage,
  type Draft,
  type DraftStorage,
} from '@/storage/draftStorage';

type RefreshDraftsOptions = {
  shouldCommit?: () => boolean;
};

type DraftListLoadResult =
  | {
      kind: 'success';
      drafts: Draft[];
    }
  | {
      kind: 'error';
      message: string;
    };

export function useHomeController(): HomeViewProps {
  const navigate = useNavigate();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const {
    drafts,
    error,
    loading,
    refreshDrafts,
    setError: setDraftListError,
  } = useDraftList(storage);
  const { tutorialSkipped, showTutorial, skipTutorial } =
    useTutorialPreference();

  const createDraft = useCallback(async () => {
    setDraftListError(null);
    try {
      const draft = await storage.saveDraft(createRegistrationDraft());
      await navigate({
        to: '/builder/listings/$draftId/$step',
        params: { draftId: draft.id, step: draft.currentStep },
      });
    } catch (caughtError) {
      setDraftListError(
        getErrorMessage(caughtError, 'Could not create draft.'),
      );
    }
  }, [navigate, setDraftListError, storage]);

  const deleteDraft = useCallback(
    async (draftId: string) => {
      // The card the user clicked is the only source of the right wording, and
      // its absence means the list moved under us — do nothing rather than
      // guess a confirmation for a draft we can no longer describe.
      const item = drafts.find((draft) => draft.id === draftId);
      if (!item) return;

      const confirmed = window.confirm(item.deleteConfirmMessage);
      if (!confirmed) return;

      setDraftListError(null);
      try {
        await storage.deleteDraft(draftId);
        await refreshDrafts();
      } catch (caughtError) {
        setDraftListError(
          getErrorMessage(caughtError, 'Could not delete draft.'),
        );
      }
    },
    [drafts, refreshDrafts, setDraftListError, storage],
  );

  return {
    drafts,
    error,
    loading,
    tutorialSkipped,
    onCreateDraft: createDraft,
    onDeleteDraft: deleteDraft,
    onRefreshDrafts: refreshDrafts,
    onShowTutorial: showTutorial,
    onSkipTutorial: skipTutorial,
  };
}

function useDraftList(storage: DraftStorage) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const draftItems = useMemo(
    () => drafts.map(createHomeDraftItem),
    [drafts],
  );

  const refreshDrafts = useCallback(
    async (options: RefreshDraftsOptions = {}) => {
      const shouldCommit = options.shouldCommit ?? (() => true);
      setLoading(true);
      setError(null);
      const result = await loadDraftList(storage);

      if (!shouldCommit()) return;

      if (result.kind === 'success') {
        setDrafts(result.drafts);
      } else {
        setError(result.message);
      }

      setLoading(false);
    },
    [storage],
  );

  useEffect(() => {
    let canceled = false;

    void refreshDrafts({ shouldCommit: () => !canceled });

    return () => {
      canceled = true;
    };
  }, [refreshDrafts]);

  return {
    drafts: draftItems,
    error,
    loading,
    refreshDrafts,
    setError,
  };
}

function useTutorialPreference() {
  const [tutorialSkipped, setTutorialSkippedState] = useState(
    () => tutorialPreference.read().skipped,
  );

  const showTutorial = useCallback(() => {
    tutorialPreference.show();
    setTutorialSkippedState(false);
  }, []);

  const skipTutorial = useCallback(() => {
    tutorialPreference.skip();
    setTutorialSkippedState(true);
  }, []);

  return {
    tutorialSkipped,
    showTutorial,
    skipTutorial,
  };
}

async function loadDraftList(
  storage: DraftStorage,
): Promise<DraftListLoadResult> {
  try {
    return {
      kind: 'success',
      drafts: await storage.listDrafts(),
    };
  } catch (caughtError) {
    return {
      kind: 'error',
      message: getErrorMessage(caughtError, 'Could not load drafts.'),
    };
  }
}
