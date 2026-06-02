import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BuilderHomeView } from '@/builder/BuilderHomeView';
import { createBuilderHomeDraftItem } from '@/builder/builderHomeModel';
import { createRegistrationDraft } from '@/builder/registrationDraft';
import { builderTutorialPreference } from '@/builder/tutorialStorage';
import {
  createDraftStorage,
  type Draft,
  type DraftStorage,
} from '@/storage/draftStorage';

type RefreshDraftsOptions = {
  shouldCommit?: () => boolean;
};

export const Route = createFileRoute('/builder')({
  component: BuilderPage,
});

function BuilderPage() {
  const navigate = useNavigate();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutorialSkipped, setTutorialSkippedState] = useState(() =>
    builderTutorialPreference.read().skipped,
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

        setError(getErrorMessage(caughtError, 'Could not load drafts.'));
      } finally {
        if (!shouldCommit()) return;

        setLoading(false);
      }
    },
    [storage],
  );

  useEffect(() => {
    let mounted = true;

    void refreshDrafts({ shouldCommit: () => mounted });

    return () => {
      mounted = false;
    };
  }, [refreshDrafts]);

  function handleCreateDraft() {
    void createDraft();
  }

  async function createDraft() {
    setError(null);
    try {
      const draft = await storage.saveDraft(createRegistrationDraft());
      await navigate({
        to: '/builder/listings/$draftId/$step',
        params: { draftId: draft.id, step: draft.currentStep },
      });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not create draft.'));
    }
  }

  function handleDeleteDraft(draftId: string) {
    void deleteDraft(draftId);
  }

  async function deleteDraft(draftId: string) {
    const confirmed = window.confirm('Delete this draft?');
    if (!confirmed) return;

    setError(null);
    try {
      await storage.deleteDraft(draftId);
      await refreshDrafts();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not delete draft.'));
    }
  }

  function handleRefreshDrafts() {
    void refreshDrafts();
  }

  function handleShowTutorial() {
    builderTutorialPreference.show();
    setTutorialSkippedState(false);
  }

  function handleSkipTutorial() {
    builderTutorialPreference.skip();
    setTutorialSkippedState(true);
  }

  return (
    <BuilderHomeView
      drafts={draftItems}
      error={error}
      loading={loading}
      tutorialSkipped={tutorialSkipped}
      onCreateDraft={handleCreateDraft}
      onDeleteDraft={handleDeleteDraft}
      onRefreshDrafts={handleRefreshDrafts}
      onShowTutorial={handleShowTutorial}
      onSkipTutorial={handleSkipTutorial}
    />
  );
}

function getErrorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}
