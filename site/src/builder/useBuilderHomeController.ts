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

export function useBuilderHomeController(): BuilderHomeViewProps {
  const navigate = useNavigate();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutorialSkipped, setTutorialSkippedState] = useState(
    () => builderTutorialPreference.read().skipped,
  );
  const draftItems = useMemo(
    () => drafts.map(createBuilderHomeDraftItem),
    [drafts],
  );

  const refreshDrafts = useCallback(
    async (options: RefreshDraftsOptions = {}) => {
      const shouldCommit = options.shouldCommit ?? (() => true);
      setLoading(true);
      setError(null);
      try {
        const nextDrafts = await storage.listDrafts();
        if (!shouldCommit()) return;

        setDrafts(nextDrafts);
      } catch (caughtError) {
        if (!shouldCommit()) return;

        setError(
          getBuilderErrorMessage(caughtError, 'Could not load drafts.'),
        );
      } finally {
        if (!shouldCommit()) return;

        setLoading(false);
      }
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

  const createDraft = useCallback(async () => {
    setError(null);
    try {
      const draft = await storage.saveDraft(createRegistrationDraft());
      await navigate({
        to: '/builder/listings/$draftId/$step',
        params: { draftId: draft.id, step: draft.currentStep },
      });
    } catch (caughtError) {
      setError(getBuilderErrorMessage(caughtError, 'Could not create draft.'));
    }
  }, [navigate, storage]);

  const deleteDraft = useCallback(
    async (draftId: string) => {
      const confirmed = window.confirm('Delete this draft?');
      if (!confirmed) return;

      setError(null);
      try {
        await storage.deleteDraft(draftId);
        await refreshDrafts();
      } catch (caughtError) {
        setError(
          getBuilderErrorMessage(caughtError, 'Could not delete draft.'),
        );
      }
    },
    [refreshDrafts, storage],
  );

  const handleShowTutorial = useCallback(() => {
    builderTutorialPreference.show();
    setTutorialSkippedState(false);
  }, []);

  const handleSkipTutorial = useCallback(() => {
    builderTutorialPreference.skip();
    setTutorialSkippedState(true);
  }, []);

  return {
    drafts: draftItems,
    error,
    loading,
    tutorialSkipped,
    onCreateDraft: createDraft,
    onDeleteDraft: deleteDraft,
    onRefreshDrafts: refreshDrafts,
    onShowTutorial: handleShowTutorial,
    onSkipTutorial: handleSkipTutorial,
  };
}
