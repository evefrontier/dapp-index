type TxExecutionStatus = {
  success?: boolean;
  error?: { message?: string } | null;
};

type TxResult = {
  $kind?: 'Transaction' | 'FailedTransaction';
  Transaction?: { digest?: string };
  FailedTransaction?: { digest?: string; status?: TxExecutionStatus };
};

/**
 * Raised when a wallet transaction is included on-chain but its execution
 * fails (Move abort, insufficient gas, etc.). `signAndExecuteTransaction`
 * resolves these as `FailedTransaction` instead of rejecting, so callers must
 * branch on the result rather than assuming success.
 */
export class TxExecutionError extends Error {
  readonly digest: string | null;

  constructor(message: string, digest: string | null) {
    super(message);
    this.name = 'TxExecutionError';
    this.digest = digest;
  }
}

/**
 * Returns the digest for a successfully executed transaction, throwing a
 * {@link TxExecutionError} for failed executions or unparseable results.
 *
 * This is the only safe gate before persisting publish success: a
 * `FailedTransaction` still carries a digest, so extracting the digest
 * unconditionally would treat on-chain failures as success.
 */
export function requireSuccessfulTxDigest(result: unknown): string {
  if (result && typeof result === 'object') {
    const r = result as TxResult;
    if (r.$kind === 'Transaction' && r.Transaction?.digest) {
      return r.Transaction.digest;
    }
    if (r.$kind === 'FailedTransaction' && r.FailedTransaction) {
      const message =
        r.FailedTransaction.status?.error?.message ??
        'Transaction execution failed.';
      throw new TxExecutionError(message, r.FailedTransaction.digest ?? null);
    }
  }
  throw new TxExecutionError('Transaction result could not be parsed.', null);
}
