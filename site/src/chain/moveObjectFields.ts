import { base64 } from '@scure/base';

export function asPlainRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function moveStringToUtf8(value: unknown): string | null {
  if (typeof value === 'string') return value;
  const record = asPlainRecord(value);
  if (!record) return null;
  if (typeof record.bytes === 'string') {
    try {
      return new TextDecoder().decode(base64.decode(record.bytes));
    } catch {
      return null;
    }
  }
  if (Array.isArray(record.bytes)) {
    return new TextDecoder().decode(Uint8Array.from(record.bytes));
  }
  return null;
}

export function coerceU8Vector(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const out: number[] = [];
  for (const byte of value) {
    if (
      typeof byte !== 'number' ||
      !Number.isInteger(byte) ||
      byte < 0 ||
      byte > 255
    ) {
      return null;
    }
    out.push(byte);
  }
  return out;
}
