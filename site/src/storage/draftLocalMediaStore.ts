import type { DraftLocalMediaStore } from './draftTypes';

const INDEXED_DB_NAME = 'dapp-index-drafts';
const INDEXED_DB_VERSION = 1;
const LOCAL_MEDIA_STORE = 'localMedia';
const LOCAL_MEDIA_DRAFT_ID_INDEX = 'byDraftId';

type LocalMediaRecord = {
  key: string;
  draftId: string;
  mediaId: string;
  content: Blob;
};

export function createIndexedDbDraftLocalMediaStore(
  indexedDb: IDBFactory = globalThis.indexedDB,
): DraftLocalMediaStore {
  async function withStore<T>(
    mode: IDBTransactionMode,
    work: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
  ): Promise<T> {
    const db = await openDraftDb(indexedDb);
    const tx = db.transaction(LOCAL_MEDIA_STORE, mode);
    const store = tx.objectStore(LOCAL_MEDIA_STORE);
    const result = await work(store);

    if (isIdbRequest<T>(result)) {
      const value = await requestToPromise(result);
      await transactionDone(tx);
      return value;
    }

    await transactionDone(tx);
    return result;
  }

  return {
    put: async ({ draftId, mediaId, content }) => {
      await withStore('readwrite', (store) =>
        store.put({
          key: mediaKey(draftId, mediaId),
          draftId,
          mediaId,
          content,
        }),
      );
    },
    get: async (draftId, mediaId) => {
      const record = await withStore<LocalMediaRecord | undefined>(
        'readonly',
        (store) => store.get(mediaKey(draftId, mediaId)),
      );
      return record?.content ?? null;
    },
    delete: async (draftId, mediaId) => {
      await withStore('readwrite', (store) =>
        store.delete(mediaKey(draftId, mediaId)),
      );
    },
    deleteDraft: async (draftId) => {
      await withStore('readwrite', (store) =>
        deleteDraftLocalMedia(store, draftId),
      );
    },
    clear: async () => {
      await withStore('readwrite', (store) => store.clear());
    },
  };
}

export function createMemoryDraftLocalMediaStore(): DraftLocalMediaStore {
  const localMedia = new Map<string, Blob>();

  return {
    put: async ({ draftId, mediaId, content }) => {
      localMedia.set(mediaKey(draftId, mediaId), content);
    },
    get: async (draftId, mediaId) =>
      localMedia.get(mediaKey(draftId, mediaId)) ?? null,
    delete: async (draftId, mediaId) => {
      localMedia.delete(mediaKey(draftId, mediaId));
    },
    deleteDraft: async (draftId) => {
      const draftPrefix = `${encodeURIComponent(draftId)}:`;
      for (const key of localMedia.keys()) {
        if (key.startsWith(draftPrefix)) {
          localMedia.delete(key);
        }
      }
    },
    clear: async () => {
      localMedia.clear();
    },
  };
}

function mediaKey(draftId: string, mediaId: string): string {
  return `${encodeURIComponent(draftId)}:${encodeURIComponent(mediaId)}`;
}

function openDraftDb(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(LOCAL_MEDIA_STORE)) {
        store = db.createObjectStore(LOCAL_MEDIA_STORE, { keyPath: 'key' });
      } else {
        store = request.transaction!.objectStore(LOCAL_MEDIA_STORE);
      }

      if (!store.indexNames.contains(LOCAL_MEDIA_DRAFT_ID_INDEX)) {
        store.createIndex(LOCAL_MEDIA_DRAFT_ID_INDEX, 'draftId', {
          unique: false,
        });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteDraftLocalMedia(
  store: IDBObjectStore,
  draftId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const index = store.index(LOCAL_MEDIA_DRAFT_ID_INDEX);
    const request = index.openCursor(IDBKeyRange.only(draftId));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }

      cursor.delete();
      cursor.continue();
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function isIdbRequest<T>(value: unknown): value is IDBRequest<T> {
  return Boolean(value && typeof value === 'object' && 'onsuccess' in value);
}
