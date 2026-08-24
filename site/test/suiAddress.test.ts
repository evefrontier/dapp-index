import { describe, expect, test } from 'bun:test';
import { isSameSuiAddress } from '../src/chain/suiAddress';

const PADDED =
  '0x0000000000000000000000000000000000000000000000000000000000000002';

describe('isSameSuiAddress', () => {
  test('matches the short form against the zero-padded form', () => {
    expect(isSameSuiAddress('0x2', PADDED)).toBe(true);
  });

  test('ignores case differences', () => {
    expect(isSameSuiAddress('0xABCDEF', '0xabcdef')).toBe(true);
  });

  test('ignores surrounding whitespace', () => {
    expect(isSameSuiAddress(`  ${PADDED}  `, '0x2')).toBe(true);
  });

  test('separates distinct addresses', () => {
    expect(isSameSuiAddress('0x2', '0x3')).toBe(false);
  });

  test('treats missing or blank addresses as no match', () => {
    expect(isSameSuiAddress(undefined, PADDED)).toBe(false);
    expect(isSameSuiAddress(PADDED, undefined)).toBe(false);
    expect(isSameSuiAddress('   ', PADDED)).toBe(false);
    expect(isSameSuiAddress(undefined, undefined)).toBe(false);
  });
});
