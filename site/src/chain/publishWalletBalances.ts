import {
  parseToMist,
  parseToUnits,
  SUI_DECIMALS,
  SUI_TYPE_ARG,
} from '@mysten/sui/utils';
import type { CoreClient } from '@mysten/sui/client';
import { assertNever } from '@/utils/assertNever';
import { formatUnits } from './coinAmount';

export const WAL_COIN_TYPE_SUFFIX = '::wal::WAL';

/** Minimum SUI for registry tx + gas on publish. */
export const PUBLISH_MIN_SUI_MIST = parseToMist('0.05');

/** Minimum WAL for at least one Walrus blob upload (9 decimals, same as SUI). */
export const PUBLISH_MIN_WAL_MIST = parseToUnits('0.1', SUI_DECIMALS);

export type PublishWalletBalanceSnapshot = {
  suiTotalMist: bigint;
  walTotalMist: bigint;
};

export type PublishCoinRequirement = {
  estimatedMist: bigint;
  estimatedLabel: string;
};

export type EvaluatePublishWalletBalancesInput = {
  snapshot: PublishWalletBalanceSnapshot;
  walRequirement?: PublishCoinRequirement;
  suiRequirement?: PublishCoinRequirement;
  walRemainingBlobCount?: number | null;
  suiEstimatedTxCount?: number | null;
};

export type PublishWalletBalanceUiState =
  | {
      kind: 'skipped';
      reason: string;
    }
  | {
      kind: 'loading';
    }
  | {
      kind: 'error';
      message: string;
    }
  | {
      kind: 'ready';
      snapshot: PublishWalletBalanceSnapshot;
      suiFormatted: string;
      walFormatted: string;
      suiSufficient: boolean;
      walSufficient: boolean;
      suiMinimumLabel: string;
      walMinimumLabel: string;
      walEstimatedLabel: string | null;
      walRemainingBlobCount: number | null;
      suiEstimatedLabel: string | null;
      suiEstimatedTxCount: number | null;
      blockers: string[];
    };

export function isWalCoinType(coinType: string): boolean {
  return coinType.endsWith(WAL_COIN_TYPE_SUFFIX);
}

export async function fetchPublishWalletBalances(
  client: CoreClient,
  owner: string,
  signal?: AbortSignal,
): Promise<PublishWalletBalanceSnapshot> {
  const { balances } = await client.listBalances({ owner, signal });
  const suiBalance = balances.find((entry) => entry.coinType === SUI_TYPE_ARG);
  const walBalance = balances.find((entry) => isWalCoinType(entry.coinType));

  return {
    suiTotalMist: suiBalance ? BigInt(suiBalance.balance) : 0n,
    walTotalMist: walBalance ? BigInt(walBalance.balance) : 0n,
  };
}

export function evaluatePublishWalletBalances({
  snapshot,
  walRequirement,
  suiRequirement,
  walRemainingBlobCount = null,
  suiEstimatedTxCount = null,
}: EvaluatePublishWalletBalancesInput): {
  suiFormatted: string;
  walFormatted: string;
  suiSufficient: boolean;
  walSufficient: boolean;
  suiMinimumLabel: string;
  walMinimumLabel: string;
  walEstimatedLabel: string | null;
  walRemainingBlobCount: number | null;
  suiEstimatedLabel: string | null;
  suiEstimatedTxCount: number | null;
  blockers: string[];
} {
  const suiFormatted = formatUnits(
    snapshot.suiTotalMist,
    SUI_DECIMALS,
    'SUI',
  );
  const walFormatted = formatUnits(snapshot.walTotalMist, SUI_DECIMALS, 'WAL');

  const walThresholdMist =
    walRequirement?.estimatedMist ?? PUBLISH_MIN_WAL_MIST;
  const suiThresholdMist =
    suiRequirement?.estimatedMist ?? PUBLISH_MIN_SUI_MIST;

  const walMinimumLabel =
    walRequirement?.estimatedLabel ??
    formatUnits(PUBLISH_MIN_WAL_MIST, SUI_DECIMALS, 'WAL');
  const suiMinimumLabel =
    suiRequirement?.estimatedLabel ??
    formatUnits(PUBLISH_MIN_SUI_MIST, SUI_DECIMALS, 'SUI');

  const suiSufficient = snapshot.suiTotalMist >= suiThresholdMist;
  const walSufficient = snapshot.walTotalMist >= walThresholdMist;

  const blockers: string[] = [];
  if (!suiSufficient) {
    blockers.push(
      `Add about ${suiMinimumLabel} for gas and registry fees (wallet has ${suiFormatted}).`,
    );
  }

  return {
    suiFormatted,
    walFormatted,
    suiSufficient,
    walSufficient,
    suiMinimumLabel,
    walMinimumLabel,
    walEstimatedLabel: walRequirement?.estimatedLabel ?? null,
    walRemainingBlobCount: walRequirement ? walRemainingBlobCount : null,
    suiEstimatedLabel: suiRequirement?.estimatedLabel ?? null,
    suiEstimatedTxCount: suiRequirement ? suiEstimatedTxCount : null,
    blockers,
  };
}

export function getPublishWalletBalanceBlockers(
  state: PublishWalletBalanceUiState,
): string[] {
  switch (state.kind) {
    case 'ready':
      return state.blockers;
    case 'loading':
      return ['Checking wallet balances.'];
    case 'error':
      return [`Could not read wallet balances: ${state.message}`];
    case 'skipped':
      return [];
    default:
      return assertNever(state);
  }
}
