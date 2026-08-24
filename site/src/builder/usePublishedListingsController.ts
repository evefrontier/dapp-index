import { useConnection } from '@evefrontier/dapp-kit';
import {
  CurrentAccountSigner,
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDappCatalog, resetDappCatalogCache } from '@/api/catalog';
import {
  registryConfigured,
  vitePackageId,
  viteRegistryId,
  viteSuiNetwork,
} from '@/chain/env';
import { buildRemoveAppTransaction } from '@/chain/registerTransactions';
import { isSameSuiAddress } from '@/chain/suiAddress';
import { requireSuccessfulTxDigest } from '@/chain/txDigest';
import type { Draft } from '@/storage/draftStorage';
import { useCancellableAsync } from './cancellableAsync';
import { formatPublishErrorMessage, getErrorMessage } from './errors';
import {
  canConfirmListingRemoval,
  createPublishedListingItems,
  createPublishedListingsState,
  getRemoveBlockedReason,
  REMOVE_LISTING_FAILED_MESSAGE,
  type PublishedListingsState,
  type RemoveListingAction,
} from './publishedListingsModel';

export type PublishedListingsControllerState = {
  state: PublishedListingsState;
  removeAction: RemoveListingAction;
  canConfirmRemoval: boolean;
  onConnectWallet: () => void;
  onRefresh: () => void;
  onRequestRemove: (slug: string) => void;
  onTypeSlug: (typedSlug: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => Promise<void>;
};

/**
 * Reads the connected wallet's on-chain listings and removes them on request.
 *
 * Shares the catalog query key with the directory so a removal invalidates one
 * cache entry rather than leaving the two views disagreeing about what exists.
 */
export function usePublishedListingsController(
  drafts: readonly Draft[],
): PublishedListingsControllerState {
  const currentAccount = useCurrentAccount();
  const currentWalletNetwork = useCurrentNetwork();
  const dAppKit = useDAppKit();
  const { handleConnect } = useConnection();
  const queryClient = useQueryClient();
  const removeTracker = useCancellableAsync();

  const walletAddress = currentAccount?.address ?? null;
  // Matches the publish path: a disconnected wallet still reports a default
  // network, which would read as a mismatch rather than "not connected".
  const walletNetwork = walletAddress ? currentWalletNetwork : null;
  const configured = registryConfigured();
  const suiNetwork = viteSuiNetwork();
  const registryId = viteRegistryId() ?? 'off';

  const [removeAction, setRemoveAction] = useState<RemoveListingAction>({
    status: 'idle',
  });

  useEffect(() => removeTracker.cancel, [removeTracker]);

  const queryKey = useMemo(
    () => ['dapp-catalog', registryId] as const,
    [registryId],
  );

  const listingsQuery = useQuery({
    queryKey,
    queryFn: fetchDappCatalog,
    enabled: configured && Boolean(walletAddress),
  });

  const listings = useMemo(() => {
    if (!walletAddress) return [];
    return createPublishedListingItems({
      drafts,
      entries: listingsQuery.data ?? [],
      walletAddress,
    });
  }, [drafts, listingsQuery.data, walletAddress]);

  const state = createPublishedListingsState({
    errorMessage: listingsQuery.error
      ? getErrorMessage(listingsQuery.error, 'Could not read the registry.')
      : null,
    listings,
    loading: listingsQuery.isPending,
    registryConfigured: configured,
    removeBlockedReason: getRemoveBlockedReason({ suiNetwork, walletNetwork }),
    walletAddress,
  });

  const refreshListings = useCallback(async () => {
    // The module-level promise memo backing the public directory and the
    // /dapps/$slug loader must be cleared before invalidating, or the query
    // re-resolves the stale promise and a removed listing reappears.
    resetDappCatalogCache();
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const onRefresh = useCallback(() => {
    void refreshListings();
  }, [refreshListings]);

  const onRequestRemove = useCallback(
    (slug: string) => {
      setRemoveAction((current) => {
        if (current.status === 'confirming' || current.status === 'removing') {
          return current;
        }
        const listing = listings.find((item) => item.slug === slug);
        if (!listing) return current;
        return {
          status: 'confirming',
          slug: listing.slug,
          name: listing.name,
          typedSlug: '',
        };
      });
    },
    [listings],
  );

  const onTypeSlug = useCallback((typedSlug: string) => {
    setRemoveAction((current) =>
      current.status === 'confirming' ? { ...current, typedSlug } : current,
    );
  }, []);

  const onCancelRemove = useCallback(() => {
    setRemoveAction((current) =>
      current.status === 'removing' ? current : { status: 'idle' },
    );
  }, []);

  const onConfirmRemove = useCallback(async () => {
    if (!canConfirmListingRemoval(removeAction)) return;
    if (removeAction.status !== 'confirming') return;

    const { slug, name } = removeAction;
    const packageId = vitePackageId();
    const currentRegistryId = viteRegistryId();
    if (!packageId || !currentRegistryId || !walletAddress) return;

    if (getRemoveBlockedReason({ suiNetwork, walletNetwork })) return;

    // The wallet can change between opening the dialog and confirming, so
    // ownership is re-checked against the data currently on screen.
    const listing = listings.find((item) => item.slug === slug);
    const owned = (listingsQuery.data ?? []).some(
      (entry) =>
        entry.registrySlug === slug &&
        isSameSuiAddress(entry.registryOwner, walletAddress),
    );
    if (!listing || !owned) {
      setRemoveAction({
        status: 'error',
        slug,
        name,
        message: 'This listing is no longer owned by the connected wallet.',
      });
      await refreshListings();
      return;
    }

    const requestId = removeTracker.begin();
    setRemoveAction({
      status: 'removing',
      slug,
      name,
      stage: 'awaiting-wallet',
    });

    try {
      const tx = buildRemoveAppTransaction({
        packageId,
        registryId: currentRegistryId,
        slug,
      });
      const signer = new CurrentAccountSigner(dAppKit);
      const executed = await signer.signAndExecuteTransaction({
        transaction: tx,
      });
      // A Move abort still resolves with a digest, so this is what separates a
      // real removal from a transaction that ran and failed.
      const digest = requireSuccessfulTxDigest(executed);
      if (!removeTracker.isCurrent(requestId)) return;

      setRemoveAction({
        status: 'removing',
        slug,
        name,
        stage: 'refreshing',
      });
      await refreshListings();
      if (!removeTracker.isCurrent(requestId)) return;

      setRemoveAction({
        status: 'success',
        slug,
        name,
        digest,
        localDraftId: listing.localDraftId,
      });
    } catch (caughtError) {
      await refreshListings();
      if (!removeTracker.isCurrent(requestId)) return;
      setRemoveAction({
        status: 'error',
        slug,
        name,
        message: formatPublishErrorMessage(caughtError, {
          fallback: REMOVE_LISTING_FAILED_MESSAGE,
        }),
      });
    }
  }, [
    dAppKit,
    listings,
    listingsQuery.data,
    refreshListings,
    removeAction,
    removeTracker,
    suiNetwork,
    walletAddress,
    walletNetwork,
  ]);

  return {
    state,
    removeAction,
    canConfirmRemoval: canConfirmListingRemoval(removeAction),
    onConnectWallet: handleConnect,
    onRefresh,
    onRequestRemove,
    onTypeSlug,
    onCancelRemove,
    onConfirmRemove,
  };
}
