import { formatAddress } from '@mysten/sui/utils';
import type { PublishWalletBalanceUiState } from '@/chain/publishWalletBalances';
import { assertNever } from '@/utils/assertNever';
import type { RegistrationPublishReadiness } from './registrationDraftPublish';
import type {
  RegistrationDraftPublishController,
  RegistrationDraftPublishState,
} from './useRegistrationDraftPublishController';

export type PublishStepControllerState = {
  mediaItemCount: number;
  publishReadiness: RegistrationPublishReadiness;
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletBalanceStatus: PublishWalletBalanceUiState;
  walletNetwork: string | null;
  onConnectWallet: () => void;
  onPublish: () => Promise<void>;
};

export type PublishTone = 'ready' | 'warning' | 'error' | 'muted';

export type PublishStatusRowModel = {
  detail: string;
  label: string;
  status: string;
  tone: PublishTone;
};

export type PublishStatusRowsModel = {
  publishJob: PublishStatusRowModel;
  publishSetup: PublishStatusRowModel;
  suiBalance: PublishStatusRowModel;
  targetNetwork: PublishStatusRowModel;
  wallet: PublishStatusRowModel;
  walletNetwork: PublishStatusRowModel;
};

export function getPublishStatusRows({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletBalanceStatus,
  walletNetwork,
}: PublishStepControllerState): PublishStatusRowsModel {
  const walletNetworkReady =
    Boolean(walletAddress) && walletNetwork === suiNetwork;
  const setupBlockerCount = publishReadiness.blockers.length;
  const networkReady = suiNetwork === 'testnet' || suiNetwork === 'mainnet';

  return {
    wallet: {
      detail: walletAddress
        ? formatAddress(walletAddress)
        : 'Connect before publish.',
      label: 'Wallet',
      status: walletAddress ? 'Connected' : 'Required',
      tone: walletAddress ? 'ready' : 'warning',
    },
    walletNetwork: {
      detail: walletNetwork ?? 'Not connected.',
      label: 'Wallet network',
      status: !walletAddress
        ? 'Required'
        : walletNetworkReady
          ? 'Ready'
          : 'Mismatch',
      tone: walletNetworkReady ? 'ready' : 'warning',
    },
    targetNetwork: {
      detail: networkReady
        ? 'S3 media upload + Sui registry.'
        : 'Use testnet or mainnet.',
      label: 'Target network',
      status: suiNetwork,
      tone: networkReady ? 'ready' : 'warning',
    },
    suiBalance: getSuiBalanceRow(walletBalanceStatus),
    publishSetup: {
      detail: publishReadiness.ready
        ? 'All prerequisites met.'
        : `${setupBlockerCount} blocker${setupBlockerCount === 1 ? '' : 's'}.`,
      label: 'Publish setup',
      status: publishReadiness.ready ? 'Ready' : 'Pending',
      tone: publishReadiness.ready ? 'ready' : 'warning',
    },
    publishJob: {
      detail: publishState.stage,
      label: 'Publish job',
      status: getPublishStateLabel(publishState),
      tone: getPublishStateTone(publishState),
    },
  };
}

function getSuiBalanceRow(
  status: PublishWalletBalanceUiState,
): PublishStatusRowModel {
  switch (status.kind) {
    case 'skipped':
      return {
        status: '—',
        detail: status.reason,
        label: 'SUI balance',
        tone: 'muted',
      };
    case 'loading':
      return {
        status: 'Checking',
        detail: 'Reading wallet balance…',
        label: 'SUI balance',
        tone: 'muted',
      };
    case 'error':
      return {
        status: 'Error',
        detail: status.message,
        label: 'SUI balance',
        tone: 'error',
      };
    case 'ready': {
      const txCount = status.suiEstimatedTxCount;
      const hasEstimate =
        status.suiEstimatedLabel !== null && txCount !== null && txCount > 0;
      return {
        label: 'SUI balance',
        status: status.suiSufficient ? 'Ready' : 'Low',
        detail: status.suiSufficient
          ? hasEstimate
            ? `${status.suiFormatted} (est. ${status.suiEstimatedLabel} for ~${txCount} txs)`
            : `${status.suiFormatted} (min ${status.suiMinimumLabel})`
          : hasEstimate
            ? `${status.suiFormatted} — need about ${status.suiMinimumLabel}`
            : `${status.suiFormatted} — need at least ${status.suiMinimumLabel}`,
        tone: status.suiSufficient ? 'ready' : 'warning',
      };
    }
    default:
      return assertNever(status);
  }
}

export function getPublishStateLabel(
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

export function getPublishStateTone(
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

export type PublishStepControllerSlice = Pick<
  RegistrationDraftPublishController,
  | 'publishReadiness'
  | 'publishState'
  | 'suiNetwork'
  | 'walletAddress'
  | 'walletBalanceStatus'
  | 'walletNetwork'
  | 'onConnectWallet'
  | 'onPublish'
>;

export function createPublishStepState(
  controller: PublishStepControllerSlice,
  mediaItemCount: number,
): PublishStepControllerState {
  return {
    mediaItemCount,
    publishReadiness: controller.publishReadiness,
    publishState: controller.publishState,
    suiNetwork: controller.suiNetwork,
    walletAddress: controller.walletAddress,
    walletBalanceStatus: controller.walletBalanceStatus,
    walletNetwork: controller.walletNetwork,
    onConnectWallet: controller.onConnectWallet,
    onPublish: controller.onPublish,
  };
}
