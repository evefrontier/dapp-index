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

  test('deletes one local media item without clearing sibling content', async () => {
    const store = createMemoryDraftLocalMediaStore();
    const firstContent = new Blob(['first'], { type: 'image/png' });
    const secondContent = new Blob(['second'], { type: 'image/png' });

    await store.put({
      draftId: 'draft-1',
      mediaId: 'screen-1',
      content: firstContent,
    });
    await store.put({
      draftId: 'draft-1',
      mediaId: 'screen-2',
      content: secondContent,
    });

    await store.delete('draft-1', 'screen-1');

    expect(await store.get('draft-1', 'screen-1')).toBeNull();
    expect(await store.get('draft-1', 'screen-2')).toEqual(secondContent);
  });
});
