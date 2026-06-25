import { useCurrentClient } from '@mysten/dapp-kit-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  evaluatePublishWalletBalances,
  fetchPublishWalletBalances,
  type PublishWalletBalanceUiState,
} from '@/chain/publishWalletBalances';
import { isWalrusChainNetwork } from '@/chain/walrusClient';
import { getErrorMessage } from './errors';

export function usePublishWalletBalances({
  targetNetwork,
  walletAddress,
  walletNetwork,
}: {
  targetNetwork: string;
  walletAddress: string | null;
  walletNetwork: string | null;
}): PublishWalletBalanceUiState {
  const client = useCurrentClient();
  const canCheck =
    Boolean(walletAddress) &&
    Boolean(walletNetwork) &&
    walletNetwork === targetNetwork &&
    isWalrusChainNetwork(targetNetwork);

  const query = useQuery({
    queryKey: ['publishWalletBalances', walletAddress, walletNetwork],
    enabled: canCheck && Boolean(walletAddress),
    queryFn: async ({ signal }) => {
      if (!walletAddress) {
        throw new Error('Wallet address is required.');
      }
      return fetchPublishWalletBalances(client.core, walletAddress, signal);
    },
    staleTime: 30_000,
    retry: 1,
  });

  return useMemo((): PublishWalletBalanceUiState => {
    if (!walletAddress) {
      return {
        kind: 'skipped',
        reason: 'Connect a wallet to check balances.',
      };
    }
    if (!walletNetwork || walletNetwork !== targetNetwork) {
      return {
        kind: 'skipped',
        reason: `Switch wallet to ${targetNetwork} to check balances.`,
      };
    }
    if (!isWalrusChainNetwork(targetNetwork)) {
      return {
        kind: 'skipped',
        reason: 'Balances are checked on testnet or mainnet only.',
      };
    }
    if (query.isPending) {
      return { kind: 'loading' };
    }
    if (query.isError) {
      return {
        kind: 'error',
        message: getErrorMessage(query.error, 'Balance check failed.'),
      };
    }

    const evaluation = evaluatePublishWalletBalances(query.data);
    return {
      kind: 'ready',
      snapshot: query.data,
      ...evaluation,
    };
  }, [
    query.data,
    query.error,
    query.isError,
    query.isPending,
    targetNetwork,
    walletAddress,
    walletNetwork,
  ]);
}
