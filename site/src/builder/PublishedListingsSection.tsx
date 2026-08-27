import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { RemoveListingModal } from './RemoveListingModal';
import type {
  PublishedListingItem,
  PublishedListingsState,
  RemoveListingAction,
} from './publishedListingsModel';
import type { PublishedListingsControllerState } from './usePublishedListingsController';

export type PublishedListingsSectionProps =
  PublishedListingsControllerState & {
    suiNetwork: string;
    onDeleteDraft: (draftId: string) => Promise<void>;
  };

export function PublishedListingsSection({
  state,
  removeAction,
  canConfirmRemoval,
  suiNetwork,
  onConnectWallet,
  onRefresh,
  onRequestRemove,
  onTypeSlug,
  onCancelRemove,
  onConfirmRemove,
  onDeleteDraft,
}: PublishedListingsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold uppercase text-(--color-neutral)">
          Published listings
        </h2>
        {state.kind === 'ready' || state.kind === 'empty' ? (
          <button
            type="button"
            className="text-sm font-bold uppercase text-(--color-martian-red)"
            onClick={onRefresh}
          >
            Refresh
          </button>
        ) : null}
      </div>

      <RemoveOutcome action={removeAction} onDeleteDraft={onDeleteDraft} />
      <StateBody
        state={state}
        removeAction={removeAction}
        onConnectWallet={onConnectWallet}
        onRefresh={onRefresh}
        onRequestRemove={onRequestRemove}
      />

      <RemoveListingModal
        action={removeAction}
        canConfirm={canConfirmRemoval}
        suiNetwork={suiNetwork}
        onCancel={onCancelRemove}
        onConfirm={onConfirmRemove}
        onTypeSlug={onTypeSlug}
      />
    </section>
  );
}

function StateBody({
  state,
  removeAction,
  onConnectWallet,
  onRefresh,
  onRequestRemove,
}: {
  state: PublishedListingsState;
  removeAction: RemoveListingAction;
  onConnectWallet: () => void;
  onRefresh: () => void;
  onRequestRemove: (slug: string) => void;
}): ReactNode {
  switch (state.kind) {
    case 'unconfigured':
      return (
        <Note>
          Registry is not configured for this environment, so published listings
          cannot be read.
        </Note>
      );
    case 'wallet-disconnected':
      return (
        <div className="grid gap-3 border border-dashed border-(--color-neutral-30) p-4">
          <p className="text-sm text-(--color-neutral-60)">
            Connect the wallet that published your listings to see them here and
            remove any you no longer maintain.
          </p>
          <Button
            variant="secondary"
            size="small"
            onClick={onConnectWallet}
          >
            Connect wallet
          </Button>
        </div>
      );
    case 'loading':
      return <Note>Reading the registry.</Note>;
    case 'error':
      return (
        <div
          className="grid gap-3 border border-(--color-alert) p-3"
          role="alert"
        >
          <p className="text-sm text-(--color-alert)">{state.message}</p>
          <button
            type="button"
            className="justify-self-start text-sm font-bold uppercase text-(--color-martian-red)"
            onClick={onRefresh}
          >
            Retry
          </button>
        </div>
      );
    case 'empty':
      return (
        <div className="grid gap-2 border border-dashed border-(--color-neutral-30) p-4">
          <p className="text-sm text-(--color-neutral-60)">
            No published listings for this wallet.
          </p>
          <p className="text-xs text-(--color-neutral-60)">
            If you expected listings here, the registry may be unreachable.
            <button
              type="button"
              className="ml-2 font-bold uppercase text-(--color-martian-red)"
              onClick={onRefresh}
            >
              Retry
            </button>
          </p>
        </div>
      );
    case 'ready':
      return (
        <div className="grid gap-3">
          {state.listings.map((listing) => (
            <PublishedListingCard
              key={listing.slug}
              listing={listing}
              removeAction={removeAction}
              removeBlockedReason={state.removeBlockedReason}
              onRequestRemove={onRequestRemove}
            />
          ))}
        </div>
      );
  }
}

function PublishedListingCard({
  listing,
  removeAction,
  removeBlockedReason,
  onRequestRemove,
}: {
  listing: PublishedListingItem;
  removeAction: RemoveListingAction;
  removeBlockedReason: string | null;
  onRequestRemove: (slug: string) => void;
}) {
  const busy =
    removeAction.status === 'removing' && removeAction.slug === listing.slug;
  const anyRemovalInFlight = removeAction.status === 'removing';

  return (
    <article className="grid gap-3 border border-(--color-neutral-20) p-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-1">
        <h3 className="truncate text-base font-bold text-(--color-neutral)">
          {listing.name}
        </h3>
        <p className="break-all text-sm text-(--color-neutral-60)">
          {listing.slug}
        </p>
        {listing.localDraftId ? (
          <p className="text-xs text-(--color-neutral-60)">
            Local draft in this browser.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/dapps/$slug"
          params={{ slug: listing.slug }}
          className="text-sm font-bold uppercase text-(--color-martian-red)"
        >
          View
        </Link>
        {removeBlockedReason ? (
          <span className="text-xs text-(--color-neutral-60)">
            {removeBlockedReason}
          </span>
        ) : (
          <button
            type="button"
            className="builder-text-button-danger disabled:opacity-40"
            disabled={anyRemovalInFlight}
            onClick={() => onRequestRemove(listing.slug)}
          >
            {busy ? 'Removing.' : 'Remove from index'}
          </button>
        )}
      </div>
    </article>
  );
}

function RemoveOutcome({
  action,
  onDeleteDraft,
}: {
  action: RemoveListingAction;
  onDeleteDraft: (draftId: string) => Promise<void>;
}) {
  if (action.status === 'success') {
    return (
      <div
        className="grid gap-2 border border-(--color-neutral-20) bg-(--color-crude-20) p-3"
        role="status"
      >
        <p className="text-sm text-(--color-neutral-60)">
          Removed {action.name} from the index.
        </p>
        {action.localDraftId ? (
          <>
            <p className="text-xs text-(--color-neutral-60)">
              A local copy of this listing is still in your drafts.
            </p>
            <button
              type="button"
              className="builder-text-button-danger justify-self-start"
              onClick={() => {
                void onDeleteDraft(action.localDraftId as string);
              }}
            >
              Remove local copy
            </button>
          </>
        ) : null}
      </div>
    );
  }

  if (action.status === 'error') {
    return (
      <div className="border border-(--color-alert) p-3" role="alert">
        <p className="text-sm text-(--color-alert)">{action.message}</p>
      </div>
    );
  }

  return null;
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-(--color-neutral-30) p-4 text-sm text-(--color-neutral-60)">
      {children}
    </div>
  );
}
