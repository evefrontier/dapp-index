import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  createDraftStorage,
  parseDraftStep,
  type Draft,
  type DraftStep,
  type DraftStorage,
} from '@/storage/draftStorage';

export const Route = createFileRoute('/builder_/listings/$draftId/$step')({
  component: BuilderListingStepPage,
});

function BuilderListingStepPage() {
  const { draftId, step } = Route.useParams();
  const [storage] = useState<DraftStorage>(() => createDraftStorage());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const validStep = parseDraftStep(step);

  useEffect(() => {
    let canceled = false;

    async function loadDraft() {
      setLoading(true);
      setError(null);
      try {
        const loadedDraft = await storage.getDraft(draftId);
        if (!canceled) setDraft(loadedDraft);
      } catch (caughtError) {
        if (!canceled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Could not load draft.',
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

  if (!validStep) {
    return (
      <BuilderStepMessage
        title="Unknown step"
        body="This wizard step is not available."
      />
    );
  }

  if (loading) {
    return (
      <BuilderStepMessage title="Loading draft" body="Opening local draft." />
    );
  }

  if (error) {
    return <BuilderStepMessage title="Draft error" body={error} />;
  }

  if (!draft) {
    return (
      <BuilderStepMessage
        title="Draft not found"
        body="This local draft is not available in this browser."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-[var(--color-neutral-60)]">
          Listing draft
        </p>
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
          {stepLabel(validStep)}
        </h1>
        <p className="text-sm text-[var(--color-neutral-70)]">
          Wizard shell and form fields land in the next PR.
        </p>
      </div>

      <section className="border border-[var(--color-neutral-20)] p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="font-bold uppercase text-[var(--color-neutral-60)]">
            Draft
          </dt>
          <dd className="break-all text-[var(--color-foreground)]">{draft.id}</dd>
          <dt className="font-bold uppercase text-[var(--color-neutral-60)]">
            Stored step
          </dt>
          <dd className="text-[var(--color-foreground)]">
            {draft.currentStep}
          </dd>
          <dt className="font-bold uppercase text-[var(--color-neutral-60)]">
            Route step
          </dt>
          <dd className="text-[var(--color-foreground)]">{validStep}</dd>
        </dl>
      </section>

      <Link
        to="/builder"
        className="text-sm font-bold uppercase text-[var(--color-primary)]"
      >
        Back to drafts
      </Link>
    </div>
  );
}

function BuilderStepMessage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--color-foreground)]">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-neutral-70)]">{body}</p>
      </div>
      <Link
        to="/builder"
        className="text-sm font-bold uppercase text-[var(--color-primary)]"
      >
        Back to drafts
      </Link>
    </div>
  );
}

function stepLabel(step: DraftStep): string {
  return step
    .split('-')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
