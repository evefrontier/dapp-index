/**
 * Deterministic JSON stringify for hashing (sorted object keys, stable arrays).
 */
export function canonicalStringify(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('canonicalStringify: non-finite number');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalStringify(v)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${canonicalStringify(o[k])}`)
      .join(',')}}`;
  }
  throw new Error(`canonicalStringify: unsupported type ${typeof value}`);
}

/** SHA-256 of UTF-8 canonical JSON; returns 32 bytes. */
export async function sha256Utf8Bytes(text: string): Promise<Uint8Array> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return new Uint8Array(buf);
}
