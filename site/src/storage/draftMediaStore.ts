import type { DraftMediaStore } from './draftTypes';

const INDEXED_DB_NAME = 'dapp-index-drafts';
const INDEXED_DB_VERSION = 1;
const MEDIA_BLOB_STORE = 'mediaBlobs';
const MEDIA_BLOB_DRAFT_ID_INDEX = 'byDraftId';

type MediaBlobRecord = {
  key: string;
  draftId: string;
  mediaId: string;
  blob: Blob;
};

export function createIndexedDbDraftMediaStore(
  indexedDb: IDBFactory = globalThis.indexedDB,
): DraftMediaStore {
  async function withStore<T>(
    mode: IDBTransactionMode,
    work: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
  ): Promise<T> {
    const db = await openDraftDb(indexedDb);
    const tx = db.transaction(MEDIA_BLOB_STORE, mode);
    const store = tx.objectStore(MEDIA_BLOB_STORE);
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
    put: async ({ draftId, mediaId, blob }) => {
      await withStore('readwrite', (store) =>
        store.put({ key: mediaKey(draftId, mediaId), draftId, mediaId, blob }),
      );
    },
    get: async (draftId, mediaId) => {
      const record = await withStore<MediaBlobRecord | undefined>(
        'readonly',
        (store) => store.get(mediaKey(draftId, mediaId)),
      );
      return record?.blob ?? null;
    },
    deleteDraft: async (draftId) => {
      await withStore('readwrite', (store) =>
        deleteDraftMediaBlobs(store, draftId),
      );
    },
    clear: async () => {
      await withStore('readwrite', (store) => store.clear());
    },
  };
}

export function createMemoryDraftMediaStore(): DraftMediaStore {
  const blobs = new Map<string, Blob>();

  return {
    put: async ({ draftId, mediaId, blob }) => {
      blobs.set(mediaKey(draftId, mediaId), blob);
    },
    get: async (draftId, mediaId) =>
      blobs.get(mediaKey(draftId, mediaId)) ?? null,
    deleteDraft: async (draftId) => {
      const draftPrefix = `${encodeURIComponent(draftId)}:`;
      for (const key of blobs.keys()) {
        if (key.startsWith(draftPrefix)) {
          blobs.delete(key);
        }
      }
    },
    clear: async () => {
      blobs.clear();
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
      if (!db.objectStoreNames.contains(MEDIA_BLOB_STORE)) {
        store = db.createObjectStore(MEDIA_BLOB_STORE, { keyPath: 'key' });
      } else {
        store = request.transaction!.objectStore(MEDIA_BLOB_STORE);
      }

      if (!store.indexNames.contains(MEDIA_BLOB_DRAFT_ID_INDEX)) {
        store.createIndex(MEDIA_BLOB_DRAFT_ID_INDEX, 'draftId', {
          unique: false,
        });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteDraftMediaBlobs(
  store: IDBObjectStore,
  draftId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const index = store.index(MEDIA_BLOB_DRAFT_ID_INDEX);
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
