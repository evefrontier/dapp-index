import { Button } from '@evefrontier/ui';
import { formatAddress } from '@mysten/sui/utils';
import type { PublishWalletBalanceUiState } from '@/chain/publishWalletBalances';
import {
  getPublishNextBlockerMessage,
  isWalrusSupportedNetwork,
} from './registrationDraftPublish';
import type {
  RegistrationDraftPublishController,
  RegistrationDraftPublishState,
} from './useRegistrationDraftPublishController';

export type PublishStepScreenProps = {
  publishReadiness: RegistrationDraftPublishController['publishReadiness'];
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletBalanceStatus: PublishWalletBalanceUiState;
  walletNetwork: string | null;
  onConnectWallet: () => void;
  onPublish: () => Promise<void>;
};

export function PublishStepScreen({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletBalanceStatus,
  walletNetwork,
  onConnectWallet,
  onPublish,
}: PublishStepScreenProps) {
  const isPublishing = publishState.status === 'publishing';
  const publishBlocker = getPublishNextBlockerMessage(publishReadiness, {
    isPublishing,
  });

  return (
    <div className="grid gap-5">
      <PublishStatusRows
        publishReadiness={publishReadiness}
        publishState={publishState}
        suiNetwork={suiNetwork}
        walletAddress={walletAddress}
        walletBalanceStatus={walletBalanceStatus}
        walletNetwork={walletNetwork}
      />
      <PublishResult publishState={publishState} />
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
    </div>
  );
}

function PublishStatusRows({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletBalanceStatus,
  walletNetwork,
}: {
  publishReadiness: RegistrationDraftPublishController['publishReadiness'];
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletBalanceStatus: PublishWalletBalanceUiState;
  walletNetwork: string | null;
}) {
  const walletNetworkReady =
    Boolean(walletAddress) && walletNetwork === suiNetwork;
  const setupBlockerCount = publishReadiness.blockers.length;
  const suiBalanceRow = getSuiBalanceRow(walletBalanceStatus);
  const walBalanceRow = getWalBalanceRow(walletBalanceStatus);

  return (
    <div className="grid border-y border-(--color-neutral-20)">
      <PublishStatusRow
        detail={
          walletAddress ? formatWalletAddress(walletAddress) : 'Connect before publish.'
        }
        label="Wallet"
        status={walletAddress ? 'Connected' : 'Required'}
        tone={walletAddress ? 'ready' : 'warning'}
      />
      <PublishStatusRow
        detail={walletNetwork ?? 'Not connected.'}
        label="Wallet network"
        status={
          !walletAddress
            ? 'Required'
            : walletNetworkReady
              ? 'Ready'
              : 'Mismatch'
        }
        tone={walletNetworkReady ? 'ready' : 'warning'}
      />
      <PublishStatusRow
        detail={
          isWalrusSupportedNetwork(suiNetwork)
            ? 'Walrus publish enabled.'
            : 'Use testnet or mainnet.'
        }
        label="Target network"
        status={suiNetwork}
        tone={isWalrusSupportedNetwork(suiNetwork) ? 'ready' : 'warning'}
      />
      <PublishStatusRow
        detail={suiBalanceRow.detail}
        label="SUI balance"
        status={suiBalanceRow.status}
        tone={suiBalanceRow.tone}
      />
      <PublishStatusRow
        detail={walBalanceRow.detail}
        label="WAL balance"
        status={walBalanceRow.status}
        tone={walBalanceRow.tone}
      />
      <PublishStatusRow
        detail={
          publishReadiness.ready
            ? 'All prerequisites met.'
            : `${setupBlockerCount} blocker${setupBlockerCount === 1 ? '' : 's'}.`
        }
        label="Publish setup"
        status={publishReadiness.ready ? 'Ready' : 'Pending'}
        tone={publishReadiness.ready ? 'ready' : 'warning'}
      />
      <PublishStatusRow
        detail={publishState.stage}
        label="Publish job"
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

type BalanceRow = {
  detail: string;
  status: string;
  tone: PublishTone;
};

function getSuiBalanceRow(status: PublishWalletBalanceUiState): BalanceRow {
  switch (status.kind) {
    case 'skipped':
      return {
        status: '—',
        detail: status.reason,
        tone: 'muted',
      };
    case 'loading':
      return {
        status: 'Checking',
        detail: 'Reading wallet balance…',
        tone: 'muted',
      };
    case 'error':
      return {
        status: 'Error',
        detail: status.message,
        tone: 'error',
      };
    case 'ready':
      return {
        status: status.suiSufficient ? 'Ready' : 'Low',
        detail: status.suiSufficient
          ? `${status.suiFormatted} (min ${status.suiMinimumLabel})`
          : `${status.suiFormatted} — need at least ${status.suiMinimumLabel}`,
        tone: status.suiSufficient ? 'ready' : 'warning',
      };
    default:
      return assertNever(status);
  }
}

function getWalBalanceRow(status: PublishWalletBalanceUiState): BalanceRow {
  switch (status.kind) {
    case 'skipped':
      return {
        status: '—',
        detail: status.reason,
        tone: 'muted',
      };
    case 'loading':
      return {
        status: 'Checking',
        detail: 'Reading wallet balance…',
        tone: 'muted',
      };
    case 'error':
      return {
        status: 'Error',
        detail: status.message,
        tone: 'error',
      };
    case 'ready':
      return {
        status: status.walSufficient ? 'Ready' : 'Low',
        detail: status.walSufficient
          ? `${status.walFormatted} (min ${status.walMinimumLabel})`
          : `${status.walFormatted} — need at least ${status.walMinimumLabel}`,
        tone: status.walSufficient ? 'ready' : 'warning',
      };
    default:
      return assertNever(status);
  }
}

function formatWalletAddress(address: string): string {
  return formatAddress(address);
}

function getPublishStateLabel(
  publishState: RegistrationDraftPublishState,
): string {
  switch (publishState.status) {
    case 'idle':
      return 'Idle';
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
