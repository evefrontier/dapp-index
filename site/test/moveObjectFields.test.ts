import { describe, expect, test } from 'bun:test';
import {
  coerceU8Vector,
  moveStringToUtf8,
} from '../src/chain/moveObjectFields';

describe('moveObjectFields', () => {
  test('moveStringToUtf8 accepts plain strings', () => {
    expect(moveStringToUtf8('frontier-library')).toBe('frontier-library');
  });

  test('moveStringToUtf8 decodes base64 Move string bytes', () => {
    expect(
      moveStringToUtf8({
        bytes: btoa('frontier-library'),
      }),
    ).toBe('frontier-library');
  });

  test('moveStringToUtf8 decodes numeric byte arrays', () => {
    expect(
      moveStringToUtf8({
        bytes: [102, 114, 111, 110, 116, 105, 101, 114],
      }),
    ).toBe('frontier');
  });

  test('coerceU8Vector rejects invalid vectors', () => {
    expect(coerceU8Vector(null)).toBeNull();
    expect(coerceU8Vector([1, 256])).toBeNull();
    expect(coerceU8Vector([1, 1.5])).toBeNull();
  });

  test('coerceU8Vector accepts byte arrays', () => {
    expect(coerceU8Vector([0, 255, 42])).toEqual([0, 255, 42]);
  });
});
