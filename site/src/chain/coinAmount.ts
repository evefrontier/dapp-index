/**
 * Smallest-unit bigint to human-readable coin text.
 * Inverse of `parseToUnits` / `parseToMist` from `@mysten/sui/utils`.
 */
export function formatUnits(
  totalUnits: bigint,
  decimals: number,
  symbol: string,
): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = totalUnits / divisor;
  const fraction = totalUnits % divisor;
  if (fraction === 0n) {
    return `${whole} ${symbol}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  return `${whole}.${fractionText} ${symbol}`;
}
