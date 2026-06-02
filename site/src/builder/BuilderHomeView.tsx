import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { BuilderHomeDraftItem } from './builderHomeModel';

export type BuilderHomeViewProps = {
  drafts: BuilderHomeDraftItem[];
  error: string | null;
  loading: boolean;
  tutorialSkipped: boolean;
  onCreateDraft: () => Promise<void>;
  onDeleteDraft: (draftId: string) => Promise<void>;
  onRefreshDrafts: () => Promise<void>;
  onShowTutorial: () => void;
  onSkipTutorial: () => void;
};

export function BuilderHomeView({
  drafts,
  error,
  loading,
  tutorialSkipped,
  onCreateDraft,
  onDeleteDraft,
  onRefreshDrafts,
  onShowTutorial,
  onSkipTutorial,
}: BuilderHomeViewProps) {
  return (
    <div className="space-y-6">
      <BuilderPageHeader onCreateDraft={onCreateDraft} />
      <BuilderTutorial
        skipped={tutorialSkipped}
        onShow={onShowTutorial}
        onSkip={onSkipTutorial}
      />
      <BuilderErrorMessage message={error} />
      <DraftListSection
        loading={loading}
        drafts={drafts}
        onRefresh={onRefreshDrafts}
        onDeleteDraft={onDeleteDraft}
      />
    </div>
  );
}

function BuilderPageHeader({
  onCreateDraft,
}: {
  onCreateDraft: () => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-bold uppercase text-[var(--color-neutral-60)]">
          Builder
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
          Dapp listings
        </h1>
        <p className="text-sm text-[var(--color-neutral-70)]">
          Create or resume a local listing draft. Publish comes later in the
          wizard.
        </p>
      </div>
      <Button
        variant="primary"
        size="medium"
        onClick={() => {
          void onCreateDraft();
        }}
      >
        New draft
      </Button>
    </div>
  );
}

function BuilderTutorial({
  skipped,
  onShow,
  onSkip,
}: {
  skipped: boolean;
  onShow: () => void;
  onSkip: () => void;
}) {
  if (skipped) {
    return (
      <button
        type="button"
        className="text-sm font-bold uppercase text-[var(--color-primary)]"
        onClick={onShow}
      >
        Show tutorial
      </button>
    );
  }

  return (
    <section className="border border-[var(--color-neutral-20)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl space-y-3">
          <h2 className="text-lg font-bold uppercase text-[var(--color-foreground)]">
            Before you publish
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--color-neutral-70)]">
            <li>Drafts stay in this browser until publish succeeds.</li>
            <li>Media stays local until publish.</li>
            <li>Wallet connection is only required for publish.</li>
          </ol>
        </div>
        <Button variant="secondary" size="small" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </section>
  );
}

function BuilderErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      className="border border-[var(--color-error)] p-3 text-sm text-[var(--color-error)]"
      role="alert"
    >
      {message}
    </div>
  );
}

function DraftListSection({
  loading,
  drafts,
  onRefresh,
  onDeleteDraft,
}: {
  loading: boolean;
  drafts: BuilderHomeDraftItem[];
  onRefresh: () => Promise<void>;
  onDeleteDraft: (draftId: string) => Promise<void>;
}) {
  let content: ReactNode;

  if (loading) {
    content = (
      <p className="text-sm text-[var(--color-neutral-70)]">Loading drafts.</p>
    );
  } else if (drafts.length === 0) {
    content = (
      <div className="border border-dashed border-[var(--color-neutral-30)] p-4 text-sm text-[var(--color-neutral-70)]">
        No drafts yet.
      </div>
    );
  } else {
    content = <DraftList drafts={drafts} onDeleteDraft={onDeleteDraft} />;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold uppercase text-[var(--color-foreground)]">
          Drafts
        </h2>
        <button
          type="button"
          className="text-sm font-bold uppercase text-[var(--color-primary)]"
          onClick={() => {
            void onRefresh();
          }}
        >
          Refresh
        </button>
      </div>

      {content}
    </section>
  );
}

function DraftList({
  drafts,
  onDeleteDraft,
}: {
  drafts: BuilderHomeDraftItem[];
  onDeleteDraft: (draftId: string) => Promise<void>;
}) {
  const draftCards = drafts.map((draft) => (
    <DraftListCard
      key={draft.id}
      draft={draft}
      onDeleteDraft={onDeleteDraft}
    />
  ));

  return <div className="grid gap-3">{draftCards}</div>;
}

function DraftListCard({
  draft,
  onDeleteDraft,
}: {
  draft: BuilderHomeDraftItem;
  onDeleteDraft: (draftId: string) => Promise<void>;
}) {
  const resumeParams = { draftId: draft.id, step: draft.currentStep };

  function handleDeleteClick() {
    void onDeleteDraft(draft.id);
  }

  return (
    <article className="grid gap-3 border border-[var(--color-neutral-20)] p-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-1">
        <h3 className="truncate text-base font-bold text-[var(--color-foreground)]">
          {draft.title}
        </h3>
        <p className="text-sm text-[var(--color-neutral-70)]">
          Step: {draft.currentStepLabel} · Updated: {draft.updatedAtLabel}
        </p>
        <p className="break-all text-xs text-[var(--color-neutral-60)]">
          {draft.id}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/builder/listings/$draftId/$step"
          params={resumeParams}
          className="text-sm font-bold uppercase text-[var(--color-primary)]"
        >
          Resume
        </Link>
        <button
          type="button"
          className="text-sm font-bold uppercase text-[var(--color-neutral-70)] hover:text-[var(--color-error)]"
          onClick={handleDeleteClick}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
