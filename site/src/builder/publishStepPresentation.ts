import { formatAddress } from '@mysten/sui/utils';
import type { PublishWalletBalanceUiState } from '@/chain/publishWalletBalances';
import { isWalrusChainNetwork } from '@/chain/walrusClient';
import { assertNever } from '@/utils/assertNever';
import type { RegistrationPublishReadiness } from './registrationDraftPublish';
import type {
  RegistrationDraftPublishController,
  RegistrationDraftPublishState,
} from './useRegistrationDraftPublishController';

export type PublishStepControllerState = {
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
  walBalance: PublishStatusRowModel;
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
      detail: isWalrusChainNetwork(suiNetwork)
        ? 'Walrus publish enabled.'
        : 'Use testnet or mainnet.',
      label: 'Target network',
      status: suiNetwork,
      tone: isWalrusChainNetwork(suiNetwork) ? 'ready' : 'warning',
    },
    suiBalance: getCoinBalanceRow(walletBalanceStatus, 'sui'),
    walBalance: getCoinBalanceRow(walletBalanceStatus, 'wal'),
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

function getCoinBalanceRow(
  status: PublishWalletBalanceUiState,
  coin: 'sui' | 'wal',
): PublishStatusRowModel {
  switch (status.kind) {
    case 'skipped':
      return {
        status: '—',
        detail: status.reason,
        label: coin === 'sui' ? 'SUI balance' : 'WAL balance',
        tone: 'muted',
      };
    case 'loading':
      return {
        status: 'Checking',
        detail: 'Reading wallet balance…',
        label: coin === 'sui' ? 'SUI balance' : 'WAL balance',
        tone: 'muted',
      };
    case 'error':
      return {
        status: 'Error',
        detail: status.message,
        label: coin === 'sui' ? 'SUI balance' : 'WAL balance',
        tone: 'error',
      };
    case 'ready':
      if (coin === 'sui') {
        return {
          label: 'SUI balance',
          status: status.suiSufficient ? 'Ready' : 'Low',
          detail: status.suiSufficient
            ? `${status.suiFormatted} (min ${status.suiMinimumLabel})`
            : `${status.suiFormatted} — need at least ${status.suiMinimumLabel}`,
          tone: status.suiSufficient ? 'ready' : 'warning',
        };
      }
      return {
        label: 'WAL balance',
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
): PublishStepControllerState {
  return {
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
