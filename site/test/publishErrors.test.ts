import { describe, expect, test } from 'bun:test';
import { formatPublishErrorMessage } from '../src/builder/errors';

describe('formatPublishErrorMessage', () => {
  test('maps WAL balance split aborts to actionable copy', () => {
    const message = formatPublishErrorMessage(
      new Error('MoveAbort in balance::split'),
      { fallback: 'fallback' },
    );

    expect(message).toBe(
      'Insufficient WAL for Walrus storage. Add WAL to your wallet or use smaller or fewer files.',
    );
  });

  test('maps gas errors to wallet copy', () => {
    const message = formatPublishErrorMessage(new Error('InsufficientGas'), {
      fallback: 'fallback',
    });

    expect(message).toBe(
      'Insufficient SUI for gas. Add SUI to your wallet and retry.',
    );
  });

  test('maps wallet approval timeouts', () => {
    const message = formatPublishErrorMessage(
      new Error('Transaction approval timed out'),
      { fallback: 'fallback' },
    );

    expect(message).toContain('Wallet approval timed out');
  });

  test('maps wallet rejections to neutral copy', () => {
    for (const raw of [
      'User rejected the request.',
      'user cancelled',
      'Rejected request by user',
    ]) {
      expect(
        formatPublishErrorMessage(new Error(raw), { fallback: 'fallback' }),
      ).toBe(
        'Wallet request was rejected. Approve the prompt in your wallet to continue.',
      );
    }
  });

  test('falls back to the original error message', () => {
    const message = formatPublishErrorMessage(new Error('Custom failure'), {
      fallback: 'fallback',
    });

    expect(message).toBe('Custom failure');
  });
});
