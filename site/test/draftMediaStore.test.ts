import { describe, expect, test } from 'bun:test';
import { createMemoryDraftMediaStore } from '../src/storage/draftStorage';

describe('draft media store', () => {
  test('does not collide media keys when IDs contain colons', async () => {
    const store = createMemoryDraftMediaStore();
    const firstBlob = new Blob(['first'], { type: 'image/png' });
    const secondBlob = new Blob(['second'], { type: 'image/png' });

    await store.put({ draftId: 'a:b', mediaId: 'c', blob: firstBlob });
    await store.put({ draftId: 'a', mediaId: 'b:c', blob: secondBlob });

    expect(await store.get('a:b', 'c')).toEqual(firstBlob);
    expect(await store.get('a', 'b:c')).toEqual(secondBlob);
  });
});
