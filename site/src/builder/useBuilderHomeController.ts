import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BuilderHomeViewProps } from './BuilderHomeView';
import { getBuilderErrorMessage } from './builderErrors';
import { createBuilderHomeDraftItem } from './builderHomeModel';
import { createRegistrationDraft } from './registrationDraft';
import { builderTutorialPreference } from './tutorialStorage';
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

export function useBuilderHomeController(): BuilderHomeViewProps {
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
    useBuilderTutorialPreference();

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
        getBuilderErrorMessage(caughtError, 'Could not create draft.'),
      );
    }
  }, [navigate, setDraftListError, storage]);

  const deleteDraft = useCallback(
    async (draftId: string) => {
      const confirmed = window.confirm('Delete this draft?');
      if (!confirmed) return;

      setDraftListError(null);
      try {
        await storage.deleteDraft(draftId);
        await refreshDrafts();
      } catch (caughtError) {
        setDraftListError(
          getBuilderErrorMessage(caughtError, 'Could not delete draft.'),
        );
      }
    },
    [refreshDrafts, setDraftListError, storage],
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
    () => drafts.map(createBuilderHomeDraftItem),
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

function useBuilderTutorialPreference() {
  const [tutorialSkipped, setTutorialSkippedState] = useState(
    () => builderTutorialPreference.read().skipped,
  );

  const showTutorial = useCallback(() => {
    builderTutorialPreference.show();
    setTutorialSkippedState(false);
  }, []);

  const skipTutorial = useCallback(() => {
    builderTutorialPreference.skip();
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
      message: getBuilderErrorMessage(caughtError, 'Could not load drafts.'),
    };
  }
}
