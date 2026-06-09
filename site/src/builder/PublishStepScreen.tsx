import { Button } from '@evefrontier/ui';
import type {
  RegistrationDraftPublishController,
  RegistrationDraftPublishState,
} from './useRegistrationDraftPublishController';

export type PublishStepScreenProps = {
  publishReadiness: RegistrationDraftPublishController['publishReadiness'];
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletNetwork: string | null;
  onConnectWallet: () => void;
  onPublish: () => Promise<void>;
};

export function PublishStepScreen({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletNetwork,
  onConnectWallet,
  onPublish,
}: PublishStepScreenProps) {
  const isPublishing = publishState.status === 'publishing';

  return (
    <div className="grid gap-5">
      <PublishStatusRows
        publishReadiness={publishReadiness}
        publishState={publishState}
        suiNetwork={suiNetwork}
        walletAddress={walletAddress}
        walletNetwork={walletNetwork}
      />
      <PublishBlockers blockers={publishReadiness.blockers} />
      <PublishResult publishState={publishState} />
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
    </div>
  );
}

function PublishStatusRows({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletNetwork,
}: {
  publishReadiness: RegistrationDraftPublishController['publishReadiness'];
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletNetwork: string | null;
}) {
  return (
    <div className="grid border-y border-(--color-neutral-20)">
      <PublishStatusRow
        detail={walletAddress ?? 'Connect before publish.'}
        label="Wallet"
        status={walletAddress ? 'Connected' : 'Required'}
        tone={walletAddress ? 'ready' : 'warning'}
      />
      <PublishStatusRow
        detail={walletNetwork ?? 'Not connected.'}
        label="Wallet net"
        status={
          !walletAddress
            ? 'Required'
            : walletNetwork === suiNetwork
              ? 'Ready'
              : 'Check'
        }
        tone={walletNetwork === suiNetwork ? 'ready' : 'warning'}
      />
      <PublishStatusRow
        detail={suiNetwork}
        label="Sui"
        status={publishReadiness.ready ? 'Ready' : 'Pending'}
        tone={publishReadiness.ready ? 'ready' : 'muted'}
      />
      <PublishStatusRow
        detail={publishState.stage}
        label="Publish"
        status={getPublishStateLabel(publishState)}
        tone={getPublishStateTone(publishState)}
      />
    </div>
  );
}

function PublishStatusRow({
  detail,
  label,
  status,
  tone,
}: {
  detail: string;
  label: string;
  status: string;
  tone: PublishTone;
}) {
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

function PublishBlockers({ blockers }: { blockers: string[] }) {
  if (blockers.length === 0) return null;

  return (
    <div className="grid gap-3">
      <h3 className="text-sm">Needs work</h3>
      <ul className="grid border-y border-(--color-neutral-20)">
        {blockers.map((blocker) => (
          <li
            key={blocker}
            className="border-t border-(--color-neutral-20) py-3 text-sm text-(--color-neutral) first:border-t-0"
          >
            {blocker}
          </li>
        ))}
      </ul>
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
        Draft cleared from this browser.
      </p>
    </div>
  );
}

type PublishTone = 'ready' | 'warning' | 'error' | 'muted';

function getPublishStateLabel(
  publishState: RegistrationDraftPublishState,
): string {
  switch (publishState.status) {
    case 'idle':
      return 'Ready';
    case 'publishing':
      return 'Running';
    case 'success':
      return 'Done';
    case 'error':
      return 'Error';
    default:
      return assertNever(publishState);
  }
}

function getPublishStateTone(
  publishState: RegistrationDraftPublishState,
): PublishTone {
  switch (publishState.status) {
    case 'idle':
      return 'muted';
    case 'publishing':
      return 'warning';
    case 'success':
      return 'ready';
    case 'error':
      return 'error';
    default:
      return assertNever(publishState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled publish state: ${String(value)}`);
}
