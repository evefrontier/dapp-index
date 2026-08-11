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
  network: PublishStatusRowModel;
  publishJob: PublishStatusRowModel;
  publishSetup: PublishStatusRowModel;
  suiBalance: PublishStatusRowModel;
  wallet: PublishStatusRowModel;
};

export function getNetworkStatusRow({
  suiNetwork,
  walletAddress,
  walletNetwork,
}: Pick<
  PublishStepControllerState,
  'suiNetwork' | 'walletAddress' | 'walletNetwork'
>): PublishStatusRowModel {
  const networkReady = suiNetwork === 'testnet' || suiNetwork === 'mainnet';
  const walletNetworkReady =
    Boolean(walletAddress) && walletNetwork === suiNetwork;

  if (!walletAddress) {
    return {
      label: 'Network',
      status: 'Required',
      detail: networkReady
        ? `Connect wallet on ${suiNetwork}.`
        : 'Publish needs testnet or mainnet.',
      tone: 'warning',
    };
  }

  if (!networkReady) {
    return {
      label: 'Network',
      status: suiNetwork,
      detail: 'Use testnet or mainnet.',
      tone: 'warning',
    };
  }

  if (!walletNetworkReady) {
    return {
      label: 'Network',
      status: 'Mismatch',
      detail: `Wallet on ${walletNetwork ?? 'unknown'} — switch to ${suiNetwork}.`,
      tone: 'warning',
    };
  }

  return {
    label: 'Network',
    status: suiNetwork,
    detail: `Wallet on ${suiNetwork} · S3 media upload + Sui registry.`,
    tone: 'ready',
  };
}

export function getPublishStatusRows({
  publishReadiness,
  publishState,
  suiNetwork,
  walletAddress,
  walletBalanceStatus,
  walletNetwork,
}: PublishStepControllerState): PublishStatusRowsModel {
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
    network: getNetworkStatusRow({
      suiNetwork,
      walletAddress,
      walletNetwork,
    }),
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
