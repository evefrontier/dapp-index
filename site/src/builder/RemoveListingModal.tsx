import { Button } from '@evefrontier/ui';
import { BuilderDialog } from './BuilderDialog';
import type { RemoveListingAction } from './publishedListingsModel';

export function RemoveListingModal({
  action,
  canConfirm,
  suiNetwork,
  onCancel,
  onConfirm,
  onTypeSlug,
}: {
  action: RemoveListingAction;
  canConfirm: boolean;
  suiNetwork: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onTypeSlug: (typedSlug: string) => void;
}) {
  if (action.status !== 'confirming') return null;

  return (
    <BuilderDialog
      backdropClassName="builder-review-modal-backdrop"
      open
      panelClassName="builder-review-modal-panel"
      title={`Remove ${action.name} from the index`}
      onClose={onCancel}
    >
      <div className="grid gap-3 text-sm text-(--color-neutral-60)">
        <p>
          Removing{' '}
          <code className="text-(--color-neutral)">{action.slug}</code>{' '}
          permanently deletes the listing from the on-chain index. It cannot be
          undone.
        </p>
        <p>
          The slug becomes available for anyone to register. Your local draft
          and uploaded media are not deleted.
        </p>
        <p>
          This requires a wallet transaction and costs gas on {suiNetwork}.
        </p>
      </div>

      <div className="builder-field grid gap-1">
        <label htmlFor="remove-listing-slug">
          Type {action.slug} to confirm
        </label>
        <input
          autoComplete="off"
          id="remove-listing-slug"
          name="remove-listing-slug"
          type="text"
          value={action.typedSlug}
          onChange={(event) => onTypeSlug(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="secondary" size="small" onClick={onCancel}>
          Cancel
        </Button>
        <button
          className="builder-text-button-danger disabled:opacity-40"
          disabled={!canConfirm}
          type="button"
          onClick={() => {
            void onConfirm();
          }}
        >
          Remove from index
        </button>
      </div>
    </BuilderDialog>
  );
}
