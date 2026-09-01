import { describe, expect, test } from 'bun:test';
import {
  TxExecutionError,
  requireSuccessfulTxDigest,
} from '../src/chain/txDigest';

describe('requireSuccessfulTxDigest', () => {
  test('returns the digest for a successful transaction', () => {
    const result = {
      $kind: 'Transaction' as const,
      Transaction: {
        digest: 'abc123',
        status: { success: true, error: null },
      },
    };

    expect(requireSuccessfulTxDigest(result)).toBe('abc123');
  });

  test('throws with the execution error message for a failed transaction', () => {
    const result = {
      $kind: 'FailedTransaction' as const,
      FailedTransaction: {
        digest: 'def456',
        status: {
          success: false,
          error: { message: 'MoveAbort(1)' },
        },
      },
    };

    expect(() => requireSuccessfulTxDigest(result)).toThrow('MoveAbort(1)');
  });

  test('exposes the digest on the thrown error for failed transactions', () => {
    const result = {
      $kind: 'FailedTransaction' as const,
      FailedTransaction: {
        digest: 'def456',
        status: { success: false, error: { message: 'MoveAbort(1)' } },
      },
    };

    try {
      requireSuccessfulTxDigest(result);
      throw new Error('expected requireSuccessfulTxDigest to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(TxExecutionError);
      expect((error as TxExecutionError).digest).toBe('def456');
    }
  });

  test('falls back to a generic message when the failure has no error detail', () => {
    const result = {
      $kind: 'FailedTransaction' as const,
      FailedTransaction: { digest: 'def456' },
    };

    expect(() => requireSuccessfulTxDigest(result)).toThrow(
      'Transaction execution failed.',
    );
  });

  test('throws for unparseable results instead of inventing a digest', () => {
    expect(() => requireSuccessfulTxDigest(null)).toThrow(TxExecutionError);
    expect(() => requireSuccessfulTxDigest({})).toThrow(
      'Transaction result could not be parsed.',
    );
  });
});
