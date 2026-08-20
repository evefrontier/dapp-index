import { Button } from '@evefrontier/ui';
import { getPublishNextBlockerMessage } from './registrationDraftPublish';
import type { PublishStepControllerState } from './publishStepPresentation';
import {
  getPublishStatusRows,
  type PublishStatusRowModel,
} from './publishStepPresentation';
import type { RegistrationDraftPublishState } from './useRegistrationDraftPublishController';

export type PublishStepScreenProps = PublishStepControllerState & {
  readOnly: boolean;
};

export function PublishStepScreen({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletBalanceStatus,
  walletNetwork,
  readOnly,
  onConnectWallet,
  onPublish,
}: PublishStepScreenProps) {
  const isPublishing = publishState.status === 'publishing';
  const publishBlocker = getPublishNextBlockerMessage(publishReadiness, {
    isPublishing,
  });
  const statusRows = getPublishStatusRows({
    publishReadiness,
    publishState,
    suiNetwork,
    walletAddress,
    walletBalanceStatus,
    walletNetwork,
    onConnectWallet,
    onPublish,
  });

  return (
    <div className="grid gap-5">
      <div className="grid border-y border-(--color-neutral-20)">
        <PublishStatusRow {...statusRows.wallet} />
        <PublishStatusRow {...statusRows.network} />
        <PublishStatusRow {...statusRows.suiBalance} />
        <PublishStatusRow {...statusRows.walBalance} />
        <PublishStatusRow {...statusRows.publishSetup} />
        <PublishStatusRow {...statusRows.publishJob} />
      </div>
      <PublishResult publishState={publishState} />
      {readOnly ? null : (
        <div className="builder-publish-actions">
          <div className="flex flex-wrap items-center gap-3">
            {!walletAddress ? (
              <Button
                disabled={isPublishing}
                size="small"
                type="button"
                variant="primary"
                onClick={onConnectWallet}
              >
                Connect wallet
              </Button>
            ) : (
              <Button
                disabled={isPublishing || !publishReadiness.ready}
                size="small"
                type="button"
                variant="primary"
                onClick={() => {
                  void onPublish();
                }}
              >
                {isPublishing ? 'Publishing' : 'Publish listing'}
              </Button>
            )}
            <p className="text-xs text-(--color-neutral-60)">
              Uploads local media, metadata, then Sui.
            </p>
          </div>
          {publishBlocker ? (
            <p className="builder-publish-blocker" role="status">
              {publishBlocker}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PublishStatusRow({
  detail,
  label,
  status,
  tone,
}: PublishStatusRowModel) {
  return (
    <div className="grid gap-3 border-t border-(--color-neutral-20) py-3 first:border-t-0 md:grid-cols-[8rem_8rem_minmax(0,1fr)] md:items-center">
      <p className="builder-review-label">{label}</p>
      <p className="builder-review-status" data-tone={tone}>
        {status}
      </p>
      <p className="min-w-0 break-words text-sm text-(--color-neutral)">
        {detail}
      </p>
    </div>
  );
}

function PublishResult({
  publishState,
}: {
  publishState: RegistrationDraftPublishState;
}) {
  if (publishState.status === 'idle' || publishState.status === 'publishing') {
    return null;
  }

  if (publishState.status === 'error') {
    return (
      <div
        className="border border-(--color-alert) p-3 text-sm text-(--color-alert)"
        role="alert"
      >
        {publishState.errorMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 border border-(--color-martian-red) p-3">
      <h3 className="text-sm">Published</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
        <dt className="builder-review-label">Action</dt>
        <dd className="text-(--color-neutral)">{publishState.action}</dd>
        <dt className="builder-review-label">Metadata URI</dt>
        <dd className="break-all text-(--color-neutral)">
          {publishState.metadataUri}
        </dd>
        <dt className="builder-review-label">Read URL</dt>
        <dd className="break-all text-(--color-neutral)">
          {publishState.metadataWalrusUrl}
        </dd>
        <dt className="builder-review-label">Digest</dt>
        <dd className="break-all text-(--color-neutral)">
          {publishState.suiTransactionDigest}
        </dd>
      </dl>
      <p className="text-xs text-(--color-neutral-60)">
        This local draft is kept as a record. Delete it from the drafts list
        when you no longer need it.
      </p>
    </div>
  );
}
