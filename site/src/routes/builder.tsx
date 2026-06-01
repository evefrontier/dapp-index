import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BuilderHomeView } from '@/builder/BuilderHomeView';
import { createBuilderHomeDraftItem } from '@/builder/builderHomeModel';
import { createRegistrationDraft } from '@/builder/registrationDraft';
import {
  getBuilderTutorialSkipped,
  setBuilderTutorialSkipped,
} from '@/builder/tutorialStorage';
import {
  createDraftStorage,
  type Draft,
  type DraftStorage,
} from '@/storage/draftStorage';

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
    getBuilderTutorialSkipped(),
  );
  const draftItems = useMemo(
    () => drafts.map(createBuilderHomeDraftItem),
    [drafts],
  );

  const refreshDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDrafts(await storage.listDrafts());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Could not load drafts.'));
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    void refreshDrafts();
  }, [refreshDrafts]);

  async function handleCreateDraft() {
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

  async function handleDeleteDraft(draftId: string) {
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
    setBuilderTutorialSkipped(false);
    setTutorialSkippedState(false);
  }

  function handleSkipTutorial() {
    setBuilderTutorialSkipped(true);
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
