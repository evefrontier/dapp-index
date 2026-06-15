import {
  parseToMist,
  parseToUnits,
  SUI_DECIMALS,
  SUI_TYPE_ARG,
} from '@mysten/sui/utils';
import type { CoreClient } from '@mysten/sui/client';
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

export function evaluatePublishWalletBalances(
  snapshot: PublishWalletBalanceSnapshot,
): {
  suiFormatted: string;
  walFormatted: string;
  suiSufficient: boolean;
  walSufficient: boolean;
  suiMinimumLabel: string;
  walMinimumLabel: string;
  blockers: string[];
} {
  const suiFormatted = formatUnits(
    snapshot.suiTotalMist,
    SUI_DECIMALS,
    'SUI',
  );
  const walFormatted = formatUnits(snapshot.walTotalMist, SUI_DECIMALS, 'WAL');
  const suiSufficient = snapshot.suiTotalMist >= PUBLISH_MIN_SUI_MIST;
  const walSufficient = snapshot.walTotalMist >= PUBLISH_MIN_WAL_MIST;
  const suiMinimumLabel = formatUnits(
    PUBLISH_MIN_SUI_MIST,
    SUI_DECIMALS,
    'SUI',
  );
  const walMinimumLabel = formatUnits(
    PUBLISH_MIN_WAL_MIST,
    SUI_DECIMALS,
    'WAL',
  );

  const blockers: string[] = [];
  if (!suiSufficient) {
    blockers.push(
      `Add at least ${suiMinimumLabel} for gas and registry fees (wallet has ${suiFormatted}).`,
    );
  }
  if (!walSufficient) {
    blockers.push(
      `Add at least ${walMinimumLabel} for Walrus storage (wallet has ${walFormatted}).`,
    );
  }

  return {
    suiFormatted,
    walFormatted,
    suiSufficient,
    walSufficient,
    suiMinimumLabel,
    walMinimumLabel,
    blockers,
  };
}

export function getPublishWalletBalanceBlockers(
  state: PublishWalletBalanceUiState,
): string[] {
  switch (state.kind) {
    case 'ready':
      return evaluatePublishWalletBalances(state.snapshot).blockers;
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

function assertNever(value: never): never {
  throw new Error(`Unhandled wallet balance state: ${String(value)}`);
}
