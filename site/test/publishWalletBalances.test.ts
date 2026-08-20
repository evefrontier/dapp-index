import { describe, expect, test } from 'bun:test';
import { formatUnits } from '../src/chain/coinAmount';
import {
  evaluatePublishWalletBalances,
  getPublishWalletBalanceBlockers,
  isWalCoinType,
  PUBLISH_MIN_SUI_MIST,
  PUBLISH_MIN_WAL_MIST,
} from '../src/chain/publishWalletBalances';
import { estimatePublishCost } from '../src/builder/publishCostEstimate';
import { draft as baseDraft } from './draftTestUtils';
import type { DraftMedia } from '../src/storage/draftTypes';

function createMedia(id: string, size: number): DraftMedia {
  return {
    id,
    kind: 'screenshot',
    role: 'gallery',
    name: `${id}.png`,
    mimeType: 'image/png',
    size,
    createdAt: '2026-05-18T12:00:00.000Z',
  };
}

describe('publish wallet balances', () => {
  test('detects WAL coin types by suffix', () => {
    expect(
      isWalCoinType(
        '0x827b7a16c8237eda1bbd53072d7eb1bd511a81acd1f68b12c8805af8b6d0314b::wal::WAL',
      ),
    ).toBe(true);
    expect(isWalCoinType('0x2::sui::SUI')).toBe(false);
  });

  test('formats token amounts with trimmed fractional zeros', () => {
    expect(formatUnits(1_240_000_000n, 9, 'SUI')).toBe('1.24 SUI');
    expect(formatUnits(50_000_000n, 9, 'SUI')).toBe('0.05 SUI');
    expect(formatUnits(0n, 9, 'WAL')).toBe('0 WAL');
  });

  test('flags low SUI balances only (WAL not required for S3 publish)', () => {
    const evaluation = evaluatePublishWalletBalances({
      snapshot: {
        suiTotalMist: PUBLISH_MIN_SUI_MIST - 1n,
        walTotalMist: PUBLISH_MIN_WAL_MIST - 1n,
      },
    });

    expect(evaluation.suiSufficient).toBe(false);
    expect(evaluation.walSufficient).toBe(false);
    expect(evaluation.blockers).toHaveLength(1);
    expect(evaluation.blockers[0]).toContain('SUI');
  });

  test('accepts balances above minimum thresholds', () => {
    const evaluation = evaluatePublishWalletBalances({
      snapshot: {
        suiTotalMist: PUBLISH_MIN_SUI_MIST,
        walTotalMist: PUBLISH_MIN_WAL_MIST,
      },
    });

    expect(evaluation.blockers).toEqual([]);
    expect(evaluation.suiSufficient).toBe(true);
    expect(evaluation.walSufficient).toBe(true);
  });

  test('blocks on SUI only when below draft-aware estimates (WAL not required for S3 publish)', () => {
    const cost = estimatePublishCost({
      ...baseDraft,
      media: [
        createMedia('img-1', 280_000),
        createMedia('img-2', 410_000),
        createMedia('img-3', 560_000),
        createMedia('img-4', 720_000),
      ],
    });

    const evaluation = evaluatePublishWalletBalances({
      snapshot: {
        suiTotalMist: cost.sui.estimatedMist - 1n,
        walTotalMist: cost.wal.estimatedMist - 1n,
      },
      walRequirement: cost.wal,
      suiRequirement: cost.sui,
      walRemainingBlobCount: cost.remainingBlobCount,
      suiEstimatedTxCount: cost.estimatedWalrusTxCount,
    });

    expect(evaluation.suiSufficient).toBe(false);
    // WAL is still reported for the mainnet Walrus path, but no longer blocks.
    expect(evaluation.walSufficient).toBe(false);
    expect(evaluation.blockers).toHaveLength(1);
    expect(evaluation.walEstimatedLabel).toBe(cost.wal.estimatedLabel);
    expect(evaluation.suiEstimatedTxCount).toBe(cost.estimatedWalrusTxCount);
  });

  test('passes when wallet meets draft-aware estimates', () => {
    const cost = estimatePublishCost({
      ...baseDraft,
      media: [
        createMedia('img-1', 280_000),
        createMedia('img-2', 410_000),
      ],
    });

    const evaluation = evaluatePublishWalletBalances({
      snapshot: {
        suiTotalMist: cost.sui.estimatedMist,
        walTotalMist: cost.wal.estimatedMist,
      },
      walRequirement: cost.wal,
      suiRequirement: cost.sui,
      walRemainingBlobCount: cost.remainingBlobCount,
      suiEstimatedTxCount: cost.estimatedWalrusTxCount,
    });

    expect(evaluation.blockers).toEqual([]);
    expect(evaluation.suiSufficient).toBe(true);
    expect(evaluation.walSufficient).toBe(true);
  });

  test('maps UI states to publish blockers', () => {
    expect(getPublishWalletBalanceBlockers({ kind: 'loading' })).toEqual([
      'Checking wallet balances.',
    ]);
    expect(
      getPublishWalletBalanceBlockers({
        kind: 'error',
        message: 'RPC timeout',
      }),
    ).toEqual(['Could not read wallet balances: RPC timeout']);
    expect(
      getPublishWalletBalanceBlockers({
        kind: 'skipped',
        reason: 'Connect a wallet to check balances.',
      }),
    ).toEqual([]);
    expect(
      getPublishWalletBalanceBlockers({
        kind: 'ready',
        snapshot: {
          suiTotalMist: PUBLISH_MIN_SUI_MIST - 1n,
          walTotalMist: PUBLISH_MIN_WAL_MIST,
        },
        ...evaluatePublishWalletBalances({
          snapshot: {
            suiTotalMist: PUBLISH_MIN_SUI_MIST - 1n,
            walTotalMist: PUBLISH_MIN_WAL_MIST,
          },
        }),
      }),
    ).toHaveLength(1);
  });
});
