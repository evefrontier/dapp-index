import { describe, expect, test } from 'bun:test';
import { withRpcTimeout } from '../src/chain/rpcTimeout';

describe('withRpcTimeout', () => {
  test('rejects with the labeled error after timeoutMs', async () => {
    await expect(
      withRpcTimeout(new Promise<never>(() => {}), 10, 'slug lookup'),
    ).rejects.toThrow('slug lookup timed out after 10ms');
  });
});
