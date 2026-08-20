import { fileURLToPath } from 'node:url';
import { Glob } from 'bun';
import { describe, expect, test } from 'bun:test';

// fileURLToPath (not URL.pathname) so the drive-letter form works on Windows.
const SRC_DIR = fileURLToPath(new URL('../src/', import.meta.url));

describe('Sui transport', () => {
  /**
   * Public fullnodes stopped serving JSON-RPC, and the error response has no CORS
   * headers, so a JSON-RPC call fails in the browser as an opaque network error.
   * Chain reads must go through gRPC.
   */
  test('no site source imports the deprecated JSON-RPC client', async () => {
    const offenders: string[] = [];
    let scanned = 0;

    for await (const path of new Glob('**/*.{ts,tsx}').scan({ cwd: SRC_DIR })) {
      const contents = await Bun.file(`${SRC_DIR}${path}`).text();
      scanned += 1;
      if (contents.includes('@mysten/sui/jsonRpc')) offenders.push(path);
    }

    expect(offenders).toEqual([]);
    // Guards against the scan silently matching nothing and passing vacuously.
    expect(scanned).toBeGreaterThan(20);
  });
});
