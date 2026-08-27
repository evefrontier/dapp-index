import { describe, expect, test } from 'bun:test';
import {
  canConfirmListingRemoval,
  createPublishedListingItems,
  createPublishedListingsState,
  getRemoveBlockedReason,
  type PublishedListingItem,
} from '../src/builder/publishedListingsModel';
import type { Draft } from '../src/storage/draftStorage';
import type { DappIndexEntry } from '../src/types/dapp-index';

const OWNER = `0x${'22'.repeat(32)}`;
const OTHER_OWNER = `0x${'33'.repeat(32)}`;

function entry(overrides: Partial<DappIndexEntry> = {}): DappIndexEntry {
  return {
    schema: 'evefrontier.dapp-index.metadata',
    schemaVersion: 1,
    id: 'route-planner',
    name: 'Route Planner',
    summary: 'Plans routes.',
    categories: ['build'],
    liveUrl: 'https://route-planner.example',
    serverTenant: 'stillness',
    registryOwner: OWNER,
    registrySlug: 'route-planner',
    metadataUri: 'https://cdn.example/metadata.json',
    ...overrides,
  } as DappIndexEntry;
}

function publishedDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'draft-1',
    status: 'published',
    currentStep: 'publish',
    completedSteps: [],
    createdAt: '2026-05-18T12:00:00.000Z',
    updatedAt: '2026-05-18T12:00:00.000Z',
    fields: { slug: 'route-planner' },
    media: [],
    ...overrides,
  };
}

describe('createPublishedListingItems', () => {
  test('keeps only listings owned by the connected wallet', () => {
    const items = createPublishedListingItems({
      drafts: [],
      entries: [
        entry(),
        entry({ registrySlug: 'other', registryOwner: OTHER_OWNER }),
      ],
      walletAddress: OWNER,
    });

    expect(items.map((item) => item.slug)).toEqual(['route-planner']);
  });

  test('matches a short-form wallet address against the padded owner', () => {
    const items = createPublishedListingItems({
      drafts: [],
      entries: [entry({ registryOwner: `0x${'0'.repeat(63)}2` })],
      walletAddress: '0x2',
    });

    expect(items).toHaveLength(1);
  });

  test('keys the item on the registry slug, not the metadata id', () => {
    const items = createPublishedListingItems({
      drafts: [],
      entries: [entry({ id: 'someone-elses-slug' })],
      walletAddress: OWNER,
    });

    expect(items[0]?.slug).toBe('route-planner');
  });

  test('drops entries with no registry slug to key removal off', () => {
    const items = createPublishedListingItems({
      drafts: [],
      entries: [entry({ registrySlug: undefined })],
      walletAddress: OWNER,
    });

    expect(items).toEqual([]);
  });

  test('links a local published draft by slug, ignoring case and spacing', () => {
    const items = createPublishedListingItems({
      drafts: [publishedDraft({ fields: { slug: '  Route-Planner ' } })],
      entries: [entry()],
      walletAddress: OWNER,
    });

    expect(items[0]?.localDraftId).toBe('draft-1');
  });

  test('ignores unpublished drafts and reports no local copy', () => {
    const items = createPublishedListingItems({
      drafts: [publishedDraft({ status: 'draft' })],
      entries: [entry()],
      walletAddress: OWNER,
    });

    expect(items[0]?.localDraftId).toBeNull();
  });

  test('orders listings by slug', () => {
    const items = createPublishedListingItems({
      drafts: [],
      entries: [
        entry({ registrySlug: 'zeta' }),
        entry({ registrySlug: 'alpha' }),
      ],
      walletAddress: OWNER,
    });

    expect(items.map((item) => item.slug)).toEqual(['alpha', 'zeta']);
  });
});

describe('createPublishedListingsState', () => {
  const listing: PublishedListingItem = {
    slug: 'route-planner',
    name: 'Route Planner',
    metadataUri: null,
    localDraftId: null,
  };

  function state(overrides: Partial<Parameters<typeof createPublishedListingsState>[0]> = {}) {
    return createPublishedListingsState({
      errorMessage: null,
      listings: [listing],
      loading: false,
      registryConfigured: true,
      removeBlockedReason: null,
      walletAddress: OWNER,
      ...overrides,
    });
  }

  test('reports an unconfigured registry before anything else', () => {
    expect(
      state({ registryConfigured: false, walletAddress: null, loading: true }),
    ).toEqual({ kind: 'unconfigured' });
  });

  test('asks for a wallet before loading', () => {
    expect(state({ walletAddress: null, loading: true })).toEqual({
      kind: 'wallet-disconnected',
    });
  });

  test('reports loading, then errors, then emptiness', () => {
    expect(state({ loading: true }).kind).toBe('loading');
    expect(state({ errorMessage: 'boom' })).toEqual({
      kind: 'error',
      message: 'boom',
    });
    expect(state({ listings: [] })).toEqual({
      kind: 'empty',
      walletAddress: OWNER,
    });
  });

  test('carries listings and the removal blocker when ready', () => {
    expect(state({ removeBlockedReason: 'Switch your wallet to testnet.' })).toEqual(
      {
        kind: 'ready',
        walletAddress: OWNER,
        listings: [listing],
        removeBlockedReason: 'Switch your wallet to testnet.',
      },
    );
  });
});

describe('getRemoveBlockedReason', () => {
  test('allows removal while the wallet network is unknown', () => {
    expect(
      getRemoveBlockedReason({ suiNetwork: 'testnet', walletNetwork: null }),
    ).toBeNull();
  });

  test('allows removal on a matching network', () => {
    expect(
      getRemoveBlockedReason({ suiNetwork: 'testnet', walletNetwork: 'testnet' }),
    ).toBeNull();
  });

  test('blocks removal on a mismatched network', () => {
    expect(
      getRemoveBlockedReason({ suiNetwork: 'testnet', walletNetwork: 'mainnet' }),
    ).toBe('Switch your wallet to testnet to remove a listing.');
  });
});

describe('canConfirmListingRemoval', () => {
  test('requires the typed slug to match', () => {
    expect(
      canConfirmListingRemoval({
        status: 'confirming',
        slug: 'route-planner',
        name: 'Route Planner',
        typedSlug: '  Route-Planner ',
      }),
    ).toBe(true);

    expect(
      canConfirmListingRemoval({
        status: 'confirming',
        slug: 'route-planner',
        name: 'Route Planner',
        typedSlug: 'route',
      }),
    ).toBe(false);
  });

  test('refuses outside the confirming state', () => {
    expect(canConfirmListingRemoval({ status: 'idle' })).toBe(false);
  });
});
