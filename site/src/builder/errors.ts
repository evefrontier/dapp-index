export function getErrorMessage(
  caughtError: unknown,
  fallback: string,
): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}

export function formatPublishErrorMessage(
  caughtError: unknown,
  { fallback }: { fallback: string },
): string {
  const message = getErrorMessage(caughtError, fallback);
  const lower = message.toLowerCase();

  if (lower.includes('balance::split')) {
    return 'Insufficient WAL for Walrus storage. Add WAL to your wallet or use smaller or fewer files.';
  }

  if (
    lower.includes('insufficientgas') ||
    /not enough.*gas/.test(lower) ||
    /gas.*insufficient/.test(lower)
  ) {
    return 'Insufficient SUI for gas. Add SUI to your wallet and retry.';
  }

  if (message.includes('Transaction approval timed out')) {
    return 'Wallet approval timed out. Approve the prompt in your wallet and try again.';
  }

  return message;
}
