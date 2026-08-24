import { normalizeSuiAddress } from '@mysten/sui/utils';

/**
 * Sui addresses compare by value, not by string. The same account reaches us in
 * different shapes: BCS decodes a registry owner to the zero-padded lowercase
 * form, while a wallet may report the short `0x2` form or mixed case. Comparing
 * the raw strings can tell an owner their own listing belongs to someone else.
 */
export function isSameSuiAddress(
  left: string | undefined,
  right: string | undefined,
): boolean {
  const leftValue = left?.trim();
  const rightValue = right?.trim();
  if (!leftValue || !rightValue) return false;

  return normalizeSuiAddress(leftValue) === normalizeSuiAddress(rightValue);
}
