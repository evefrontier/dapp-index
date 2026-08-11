import { Glob } from 'bun';
import { describe, expect, test } from 'bun:test';

const SRC_DIR = new URL('../src/', import.meta.url).pathname;

describe('Sui transport', () => {
  /**
   * Public fullnodes stopped serving JSON-RPC, and the error response has no CORS
   * headers, so a JSON-RPC call fails in the browser as an opaque network error.
   * Chain reads must go through gRPC.
   */
  test('no site source imports the deprecated JSON-RPC client', async () => {
    // Directory catalog still uses JSON-RPC until the catalog gRPC migration
    // lands. Keep it allowlisted so the showcase branch can integrate gRPC
    // slug reads without pretending the directory scan is fixed.
    const allowed = new Set(['chain/registryCatalog.ts']);
    const offenders: string[] = [];
    let scanned = 0;

    for await (const path of new Glob('**/*.{ts,tsx}').scan({ cwd: SRC_DIR })) {
      const contents = await Bun.file(`${SRC_DIR}${path}`).text();
      scanned += 1;
      if (
        contents.includes('@mysten/sui/jsonRpc') &&
        !allowed.has(path)
      ) {
        offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
    // Guards against the scan silently matching nothing and passing vacuously.
    expect(scanned).toBeGreaterThan(20);
  });
});
