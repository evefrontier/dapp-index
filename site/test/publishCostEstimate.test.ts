import { describe, expect, test } from 'bun:test';
import { parseToUnits, SUI_DECIMALS } from '@mysten/sui/utils';
import {
  countRemainingPublishBlobs,
  estimatePublishCost,
  WALRUS_STORAGE_EPOCHS,
} from '../src/builder/publishCostEstimate';
import type { Draft, DraftMedia } from '../src/storage/draftTypes';
import { draft as baseDraft } from './draftTestUtils';

function createMedia(
  id: string,
  size: number,
  overrides: Partial<DraftMedia> = {},
): DraftMedia {
  return {
    id,
    kind: 'screenshot',
    role: 'gallery',
    name: `${id}.png`,
    mimeType: 'image/png',
    size,
    createdAt: '2026-05-18T12:00:00.000Z',
    ...overrides,
  };
}

function createDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    ...baseDraft,
    ...overrides,
  };
}

describe('publish cost estimate', () => {
  test('exports shared Walrus storage epochs', () => {
    expect(WALRUS_STORAGE_EPOCHS).toBe(5);
  });

  test('empty draft uses floor estimates with registry SUI tx', () => {
    const estimate = estimatePublishCost(createDraft());

    expect(estimate.remainingBlobCount).toBe(1);
    expect(estimate.wal.estimatedMist).toBeGreaterThan(0n);
    expect(estimate.sui.estimatedMist).toBeGreaterThan(0n);
    expect(estimate.estimatedWalrusTxCount).toBe(2);
  });

  test('all media and metadata checkpointed only needs registry SUI fudge', () => {
    const fullyCheckpointed = createDraft({
      media: [createMedia('hero', 420_000)],
      publish: {
        media: [
          {
            mediaId: 'hero',
            walrusBlobId: 'blob-hero',
            walrusUrl: 'https://example.test/hero',
            sha256: 'abc',
            sizeBytes: 420_000,
            width: 800,
            height: 600,
          },
        ],
        metadataHash: 'hash',
        walrusBlobId: 'blob-meta',
        walrusUrl: 'https://example.test/meta',
      },
    });
    const estimate = estimatePublishCost(fullyCheckpointed);

    expect(countRemainingPublishBlobs(fullyCheckpointed)).toEqual({
      remainingMediaCount: 0,
      metadataBlobNeeded: false,
      remainingBlobCount: 0,
    });
    expect(estimate.remainingBlobCount).toBe(0);
    expect(estimate.estimatedWalrusTxCount).toBe(0);
  });

  test('regression: realistic multi-image draft exceeds 0.226 WAL estimate', () => {
    const estimate = estimatePublishCost(
      createDraft({
        media: [
          createMedia('img-1', 280_000),
          createMedia('img-2', 410_000),
          createMedia('img-3', 560_000),
          createMedia('img-4', 720_000),
        ],
      }),
    );

    const observedFailureWalMist = parseToUnits('0.226', SUI_DECIMALS);
    expect(estimate.remainingBlobCount).toBe(5);
    expect(estimate.wal.estimatedMist).toBeGreaterThan(observedFailureWalMist);
    expect(estimate.wal.estimatedMist).toBeLessThan(parseToUnits('2', SUI_DECIMALS));
  });

  test('large total media bytes does not inflate WAL into triple digits', () => {
    const estimate = estimatePublishCost(
      createDraft({
        media: [createMedia('video-1', 38_000_000, { kind: 'video' })],
      }),
    );

    expect(estimate.wal.estimatedMist).toBeLessThan(parseToUnits('5', SUI_DECIMALS));
  });

  test('per-blob floor dominates for small images', () => {
    const estimate = estimatePublishCost(
      createDraft({
        media: [createMedia('img-1', 280_000)],
      }),
    );

    expect(estimate.wal.estimatedMist).toBeGreaterThan(parseToUnits('0.04', SUI_DECIMALS));
    expect(estimate.wal.estimatedMist).toBeLessThan(parseToUnits('0.2', SUI_DECIMALS));
  });

  test('partial checkpoints lower remaining blob count', () => {
    const estimate = estimatePublishCost(
      createDraft({
        media: [
          createMedia('img-1', 280_000),
          createMedia('img-2', 410_000),
        ],
        publish: {
          media: [
            {
              mediaId: 'img-1',
              walrusBlobId: 'blob-1',
              walrusUrl: 'https://example.test/1',
              sha256: 'abc',
              sizeBytes: 280_000,
              width: 800,
              height: 600,
            },
          ],
        },
      }),
    );

    expect(estimate.remainingBlobCount).toBe(2);
  });

  test('replaced file with same media id but different size still counts', () => {
    const estimate = estimatePublishCost(
      createDraft({
        media: [createMedia('img-1', 500_000)],
        publish: {
          media: [
            {
              mediaId: 'img-1',
              walrusBlobId: 'blob-1',
              walrusUrl: 'https://example.test/1',
              sha256: 'abc',
              sizeBytes: 280_000,
              width: 800,
              height: 600,
            },
          ],
        },
      }),
    );

    expect(estimate.remainingBlobCount).toBe(2);
  });

  test('metadata checkpoint removes metadata blob from estimate', () => {
    const media = [
      createMedia('img-1', 280_000),
      createMedia('img-2', 410_000),
      createMedia('img-3', 560_000),
    ];
    const withoutMetadata = estimatePublishCost(
      createDraft({ media }),
    );
    const withMetadata = estimatePublishCost(
      createDraft({
        media,
        publish: {
          metadataHash: 'hash',
          walrusBlobId: 'blob-meta',
          walrusUrl: 'https://example.test/meta',
        },
      }),
    );

    expect(withMetadata.remainingBlobCount).toBe(3);
    expect(withoutMetadata.remainingBlobCount).toBe(4);
    expect(withMetadata.wal.estimatedMist).toBeLessThan(
      withoutMetadata.wal.estimatedMist,
    );
  });

  test('SUI estimate scales with remaining blob count', () => {
    const oneBlob = estimatePublishCost(
      createDraft({ media: [createMedia('img-1', 280_000)] }),
    );
    const threeBlobs = estimatePublishCost(
      createDraft({
        media: [
          createMedia('img-1', 280_000),
          createMedia('img-2', 280_000),
          createMedia('img-3', 280_000),
        ],
      }),
    );

    expect(threeBlobs.sui.estimatedMist).toBeGreaterThan(oneBlob.sui.estimatedMist);
    expect(threeBlobs.estimatedWalrusTxCount).toBe(8);
  });
});
