import { describe, expect, test } from 'bun:test';
import { createMemoryDraftLocalMediaStore } from '../src/storage/draftStorage';

describe('draft local media store', () => {
  test('does not collide media keys when IDs contain colons', async () => {
    const store = createMemoryDraftLocalMediaStore();
    const firstContent = new Blob(['first'], { type: 'image/png' });
    const secondContent = new Blob(['second'], { type: 'image/png' });

    await store.put({ draftId: 'a:b', mediaId: 'c', content: firstContent });
    await store.put({ draftId: 'a', mediaId: 'b:c', content: secondContent });

    expect(await store.get('a:b', 'c')).toEqual(firstContent);
    expect(await store.get('a', 'b:c')).toEqual(secondContent);
  });
});
