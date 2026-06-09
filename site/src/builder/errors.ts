export function getErrorMessage(
  caughtError: unknown,
  fallback: string,
): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}
