import { normalizeRegistrySlug } from '@/chain/normalizeRegistrySlug';
import { isSameSuiAddress } from '@/chain/suiAddress';
import type { Draft } from '@/storage/draftStorage';
import type { DappIndexEntry } from '@/types/dapp-index';
import { isPublishedDraft } from './publishedDraft';

export type PublishedListingItem = {
  /**
   * The on-chain key. `remove_app` is keyed by the registry slug, never by the
   * metadata document's `id`.
   */
  slug: string;
  name: string;
  metadataUri: string | null;
  /** Local draft recording this publish, when this browser still holds one. */
  localDraftId: string | null;
};

export type PublishedListingsState =
  | { kind: 'unconfigured' }
  | { kind: 'wallet-disconnected' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty'; walletAddress: string }
  | {
      kind: 'ready';
      walletAddress: string;
      listings: PublishedListingItem[];
      /** `null` when removal is allowed; otherwise why it is blocked. */
      removeBlockedReason: string | null;
    };

export type RemoveListingAction =
  | { status: 'idle' }
  | { status: 'confirming'; slug: string; name: string; typedSlug: string }
  | {
      status: 'removing';
      slug: string;
      name: string;
      stage: 'awaiting-wallet' | 'refreshing';
    }
  | {
      status: 'success';
      slug: string;
      name: string;
      digest: string;
      localDraftId: string | null;
    }
  | { status: 'error'; slug: string; name: string; message: string };

/**
 * A listing removed from the registry between the read and the confirm aborts
 * on chain rather than silently doing nothing, so the copy has to leave room
 * for that without claiming it as the only cause.
 */
export const REMOVE_LISTING_FAILED_MESSAGE =
  'Could not remove listing. It may already have been removed — the list has been refreshed.';

export function getRemoveBlockedReason({
  suiNetwork,
  walletNetwork,
}: {
  suiNetwork: string;
  walletNetwork: string | null | undefined;
}): string | null {
  // The catalog read is pinned to the configured network, so listings load
  // regardless of where the wallet is pointed. Only signing needs to match.
  if (!walletNetwork) return null;
  if (walletNetwork !== suiNetwork) {
    return `Switch your wallet to ${suiNetwork} to remove a listing.`;
  }
  return null;
}

export function createPublishedListingItems({
  drafts,
  entries,
  walletAddress,
}: {
  drafts: readonly Draft[];
  entries: readonly DappIndexEntry[];
  walletAddress: string;
}): PublishedListingItem[] {
  const draftIdBySlug = new Map<string, string>();
  for (const draft of drafts) {
    if (!isPublishedDraft(draft)) continue;
    const slug = draft.fields.slug;
    if (typeof slug !== 'string') continue;
    const normalized = normalizeRegistrySlug(slug);
    if (!normalized || draftIdBySlug.has(normalized)) continue;
    draftIdBySlug.set(normalized, draft.id);
  }

  return entries
    .filter(
      (entry) =>
        typeof entry.registrySlug === 'string' &&
        entry.registrySlug.length > 0 &&
        isSameSuiAddress(entry.registryOwner, walletAddress),
    )
    .map((entry) => {
      const slug = entry.registrySlug as string;
      return {
        slug,
        name: entry.name,
        metadataUri: entry.metadataUri ?? null,
        localDraftId: draftIdBySlug.get(normalizeRegistrySlug(slug)) ?? null,
      };
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

export function createPublishedListingsState({
  errorMessage,
  listings,
  loading,
  registryConfigured,
  removeBlockedReason,
  walletAddress,
}: {
  errorMessage: string | null;
  listings: PublishedListingItem[];
  loading: boolean;
  registryConfigured: boolean;
  removeBlockedReason: string | null;
  walletAddress: string | null;
}): PublishedListingsState {
  // Registry config is checked before the query result: an unconfigured
  // registry resolves to an empty catalog rather than an error, so deciding
  // later would render "nothing published" for "nowhere to look".
  if (!registryConfigured) return { kind: 'unconfigured' };
  if (!walletAddress) return { kind: 'wallet-disconnected' };
  if (loading) return { kind: 'loading' };
  if (errorMessage) return { kind: 'error', message: errorMessage };
  if (listings.length === 0) return { kind: 'empty', walletAddress };

  return { kind: 'ready', walletAddress, listings, removeBlockedReason };
}

export function canConfirmListingRemoval(action: RemoveListingAction): boolean {
  return (
    action.status === 'confirming' &&
    normalizeRegistrySlug(action.typedSlug) === action.slug
  );
}
