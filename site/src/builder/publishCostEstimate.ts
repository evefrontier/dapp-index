import { parseToMist, parseToUnits, SUI_DECIMALS } from '@mysten/sui/utils';
import {
  type PublishCoinRequirement,
  PUBLISH_MIN_SUI_MIST,
  PUBLISH_MIN_WAL_MIST,
} from '@/chain/publishWalletBalances';
import { formatUnits } from '@/chain/coinAmount';
import type { Draft, DraftMedia } from '@/storage/draftTypes';

/**
 * Walrus storage duration used when registering blobs during publish.
 *
 * NOTE: The WAL pricing constants below are hardcoded heuristics, not values
 * read from the live Walrus system object. See
 * `docs/PUBLISH_COST_ESTIMATE.md` for the known tradeoff and the plan to
 * replace them with on-chain pricing.
 */
export const WALRUS_STORAGE_EPOCHS = 5;

/** Conservative metadata JSON size when the metadata blob is still needed. */
export const PUBLISH_METADATA_BLOB_BYTES = 8_192;

/** Walrus list price: 0.0001 WAL per encoded MiB per storage epoch. */
export const WAL_MIST_PER_ENCODED_MIB_EPOCH = parseToUnits('0.0001', SUI_DECIMALS);

/** Erasure-coded size fudge applied to source bytes (Walrus encoded size). */
export const WAL_ENCODED_SIZE_RATIO = 5n;

/** Walrus bills at least one encoded storage unit (1 MiB) per blob. */
export const WAL_MIN_ENCODED_MIB_PER_BLOB = 1n;

const MIB_BYTES = 1_048_576n;

/**
 * Observed testnet floor per small blob (reserve + register), above naive MiB list
 * price. Calibrated so multi-image drafts above ~0.226 WAL show Low.
 */
export const PUBLISH_WAL_PER_BLOB_FLOOR_MIST = parseToUnits('0.045', SUI_DECIMALS);

/** Walrus per-write fee (20_000 FROST) per blob register. */
export const PUBLISH_WAL_WRITE_FEE_MIST = 20_000n;

export const WAL_ESTIMATE_BUFFER_BPS = 11_000n;
export const SUI_ESTIMATE_BUFFER_BPS = 11_000n;

/** SUI gas + relay tip fudge per Walrus on-chain tx (register or certify). */
export const PUBLISH_SUI_PER_WALRUS_TX_MIST = parseToMist('0.015');

/** SUI gas fudge for the registry register/update transaction. */
export const PUBLISH_SUI_REGISTRY_TX_MIST = parseToMist('0.01');

export type PublishCostCoinEstimate = PublishCoinRequirement;

export type PublishCostEstimate = {
  wal: PublishCostCoinEstimate;
  sui: PublishCostCoinEstimate;
  remainingBlobCount: number;
  remainingMediaBytes: number;
  metadataBytes: number;
  totalBytes: number;
  estimatedWalrusTxCount: number;
};

function isMediaCheckpointed(
  media: DraftMedia,
  checkpoints: NonNullable<Draft['publish']>['media'],
): boolean {
  if (!checkpoints?.length) return false;
  return checkpoints.some(
    (checkpoint) =>
      checkpoint.mediaId === media.id &&
      checkpoint.sizeBytes === media.size,
  );
}

function isMetadataCheckpointed(draft: Draft): boolean {
  const publish = draft.publish;
  if (!publish) return false;
  return Boolean(
    publish.metadataHash && publish.walrusBlobId && publish.walrusUrl,
  );
}

export function countRemainingPublishBlobs(draft: Draft): {
  remainingMediaCount: number;
  metadataBlobNeeded: boolean;
  remainingBlobCount: number;
} {
  const checkpoints = draft.publish?.media ?? [];
  const remainingMedia = draft.media.filter(
    (item) => !isMediaCheckpointed(item, checkpoints),
  );
  const metadataBlobNeeded = !isMetadataCheckpointed(draft);
  return {
    remainingMediaCount: remainingMedia.length,
    metadataBlobNeeded,
    remainingBlobCount:
      remainingMedia.length + (metadataBlobNeeded ? 1 : 0),
  };
}

function applyEstimateBuffer(amount: bigint, bufferBps: bigint): bigint {
  return (amount * bufferBps) / 10_000n;
}

function formatCoinEstimate(mist: bigint, symbol: 'WAL' | 'SUI'): string {
  return formatUnits(mist, SUI_DECIMALS, symbol);
}

/** WAL mist for one blob from source byte size (sum per blob; do not scale total bytes once). */
export function estimateWalMistForBlobSourceBytes(sourceBytes: number): bigint {
  const encodedBytes = BigInt(sourceBytes) * WAL_ENCODED_SIZE_RATIO;
  const encodedMiB = maxBigint(
    WAL_MIN_ENCODED_MIB_PER_BLOB,
    (encodedBytes + MIB_BYTES - 1n) / MIB_BYTES,
  );
  const linearWalMist =
    encodedMiB *
    WAL_MIST_PER_ENCODED_MIB_EPOCH *
    BigInt(WALRUS_STORAGE_EPOCHS);
  const reserveWalMist = maxBigint(
    PUBLISH_WAL_PER_BLOB_FLOOR_MIST,
    linearWalMist,
  );
  return reserveWalMist + PUBLISH_WAL_WRITE_FEE_MIST;
}

export function estimatePublishCost(draft: Draft): PublishCostEstimate {
  const checkpoints = draft.publish?.media ?? [];
  const remainingMedia = draft.media.filter(
    (item) => !isMediaCheckpointed(item, checkpoints),
  );
  const metadataBlobNeeded = !isMetadataCheckpointed(draft);
  const remainingBlobCount =
    remainingMedia.length + (metadataBlobNeeded ? 1 : 0);
  const remainingMediaBytes = remainingMedia.reduce(
    (total, item) => total + item.size,
    0,
  );
  const metadataBytes = metadataBlobNeeded ? PUBLISH_METADATA_BLOB_BYTES : 0;
  const totalBytes = remainingMediaBytes + metadataBytes;

  const perBlobWalMist = [
    ...remainingMedia.map((item) => estimateWalMistForBlobSourceBytes(item.size)),
    ...(metadataBlobNeeded
      ? [estimateWalMistForBlobSourceBytes(PUBLISH_METADATA_BLOB_BYTES)]
      : []),
  ];
  const rawWalMist = maxBigint(
    PUBLISH_MIN_WAL_MIST,
    perBlobWalMist.reduce((total, amount) => total + amount, 0n),
  );
  const estimatedWalMist = applyEstimateBuffer(
    rawWalMist,
    WAL_ESTIMATE_BUFFER_BPS,
  );

  const estimatedWalrusTxCount = remainingBlobCount * 2;
  const rawSuiMist = maxBigint(
    PUBLISH_MIN_SUI_MIST,
    BigInt(estimatedWalrusTxCount) * PUBLISH_SUI_PER_WALRUS_TX_MIST +
      PUBLISH_SUI_REGISTRY_TX_MIST,
  );
  const estimatedSuiMist = applyEstimateBuffer(
    rawSuiMist,
    SUI_ESTIMATE_BUFFER_BPS,
  );

  return {
    wal: {
      estimatedMist: estimatedWalMist,
      estimatedLabel: formatCoinEstimate(estimatedWalMist, 'WAL'),
    },
    sui: {
      estimatedMist: estimatedSuiMist,
      estimatedLabel: formatCoinEstimate(estimatedSuiMist, 'SUI'),
    },
    remainingBlobCount,
    remainingMediaBytes,
    metadataBytes,
    totalBytes,
    estimatedWalrusTxCount,
  };
}

function maxBigint(...values: bigint[]): bigint {
  return values.reduce((max, value) => (value > max ? value : max), 0n);
}
