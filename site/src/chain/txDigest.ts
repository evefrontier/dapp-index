type TxResult = {
  $kind: 'Transaction' | 'FailedTransaction';
  Transaction?: { digest: string };
  FailedTransaction?: { digest: string };
};

export function txResultDigest(result: unknown): string {
  if (!result || typeof result !== 'object') return 'unknown';
  const r = result as TxResult;
  if (r.$kind === 'Transaction' && r.Transaction) {
    return r.Transaction.digest;
  }
  if (r.$kind === 'FailedTransaction' && r.FailedTransaction) {
    return r.FailedTransaction.digest;
  }
  return 'unknown';
}
