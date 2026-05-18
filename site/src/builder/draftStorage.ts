export const BUILDER_DRAFTS_STORAGE_KEY = 'dapp-index:builder-drafts:v1';

const INDEXED_DB_NAME = 'dapp-index-builder-drafts';
const INDEXED_DB_VERSION = 1;
const MEDIA_BLOB_STORE = 'mediaBlobs';

export type BuilderDraftStatus = 'draft' | 'ready-to-publish' | 'published';

export type BuilderDraftMediaKind = 'screenshot' | 'video';

export type BuilderDraftMedia = {
  id: string;
  kind: BuilderDraftMediaKind;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBlobId?: string;
  uploadedUrl?: string;
};

export type BuilderDraft = {
  id: string;
  status: BuilderDraftStatus;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, unknown>;
  media: BuilderDraftMedia[];
};

export type BuilderDraftMediaInput = {
  id: string;
  kind: BuilderDraftMediaKind;
  name: string;
  mimeType?: string;
};

export type BuilderDraftMediaValidation =
  | { ok: true }
  | { ok: false; reason: string };

export type BuilderDraftMediaStore = {
  put(input: {
    draftId: string;
    mediaId: string;
    blob: Blob;
  }): Promise<void>;
  get(draftId: string, mediaId: string): Promise<Blob | null>;
  deleteDraft(draftId: string): Promise<void>;
  clear(): Promise<void>;
};

export type BuilderDraftStorageOptions = {
  localStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  mediaStore?: BuilderDraftMediaStore;
  now?: () => Date;
};

export type BuilderDraftStorage = {
  saveDraft(draft: BuilderDraft): Promise<BuilderDraft>;
  getDraft(draftId: string): Promise<BuilderDraft | null>;
  listDrafts(): Promise<BuilderDraft[]>;
  saveMedia(
    draftId: string,
    media: BuilderDraftMediaInput,
    blob: Blob,
  ): Promise<BuilderDraftMedia>;
  getMediaBlob(draftId: string, mediaId: string): Promise<Blob | null>;
  deleteDraft(draftId: string): Promise<void>;
  clearPublishedDraft(draftId: string): Promise<void>;
  clearDrafts(): Promise<void>;
};

export function createBuilderDraftStorage(
  options: BuilderDraftStorageOptions = {},
): BuilderDraftStorage {
  const storage = options.localStorage ?? globalThis.localStorage;
  const mediaStore =
    options.mediaStore ?? createIndexedDbBuilderDraftMediaStore();
  const now = options.now ?? (() => new Date());

  function readDrafts(): Record<string, BuilderDraft> {
    const raw = storage.getItem(BUILDER_DRAFTS_STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, BuilderDraft>;
    } catch {
      return {};
    }
  }

  function writeDrafts(drafts: Record<string, BuilderDraft>): void {
    storage.setItem(BUILDER_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }

  async function saveDraft(draft: BuilderDraft): Promise<BuilderDraft> {
    const drafts = readDrafts();
    drafts[draft.id] = draft;
    writeDrafts(drafts);
    return draft;
  }

  async function getDraft(draftId: string): Promise<BuilderDraft | null> {
    return readDrafts()[draftId] ?? null;
  }

  async function listDrafts(): Promise<BuilderDraft[]> {
    return Object.values(readDrafts()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async function saveMedia(
    draftId: string,
    input: BuilderDraftMediaInput,
    blob: Blob,
  ): Promise<BuilderDraftMedia> {
    const drafts = readDrafts();
    const draft = drafts[draftId];
    if (!draft) {
      throw new Error(`Builder draft not found: ${draftId}`);
    }

    const mimeType = input.mimeType ?? blob.type;
    const validation = validateBuilderDraftMediaFile({
      kind: input.kind,
      file: blob,
      mimeType,
    });
    if (!validation.ok) {
      throw new Error(validation.reason);
    }

    const media: BuilderDraftMedia = {
      id: input.id,
      kind: input.kind,
      name: input.name,
      mimeType,
      size: blob.size,
      createdAt: now().toISOString(),
    };

    await mediaStore.put({ draftId, mediaId: media.id, blob });

    drafts[draftId] = {
      ...draft,
      updatedAt: now().toISOString(),
      media: [
        ...draft.media.filter((item) => item.id !== media.id),
        media,
      ],
    };
    writeDrafts(drafts);

    return media;
  }

  async function getMediaBlob(
    draftId: string,
    mediaId: string,
  ): Promise<Blob | null> {
    return mediaStore.get(draftId, mediaId);
  }

  async function deleteDraft(draftId: string): Promise<void> {
    const drafts = readDrafts();
    delete drafts[draftId];
    writeDrafts(drafts);
    await mediaStore.deleteDraft(draftId);
  }

  async function clearDrafts(): Promise<void> {
    storage.removeItem(BUILDER_DRAFTS_STORAGE_KEY);
    await mediaStore.clear();
  }

  return {
    saveDraft,
    getDraft,
    listDrafts,
    saveMedia,
    getMediaBlob,
    deleteDraft,
    clearPublishedDraft: deleteDraft,
    clearDrafts,
  };
}

export function validateBuilderDraftMediaFile(input: {
  kind: BuilderDraftMediaKind;
  file: Blob;
  mimeType?: string;
}): BuilderDraftMediaValidation {
  const mimeType = (input.mimeType ?? input.file.type).toLowerCase();

  if (input.kind === 'video') {
    return mimeType === 'video/webm'
      ? { ok: true }
      : { ok: false, reason: 'Only video/webm videos are supported.' };
  }

  if (['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: 'Screenshots must be PNG, JPEG, or WebP images.',
  };
}

export function createIndexedDbBuilderDraftMediaStore(
  indexedDb: IDBFactory = globalThis.indexedDB,
): BuilderDraftMediaStore {
  async function withStore<T>(
    mode: IDBTransactionMode,
    work: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
  ): Promise<T> {
    const db = await openBuilderDraftDb(indexedDb);
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

export function createMemoryBuilderDraftMediaStore(): BuilderDraftMediaStore {
  const blobs = new Map<string, Blob>();

  return {
    put: async ({ draftId, mediaId, blob }) => {
      blobs.set(mediaKey(draftId, mediaId), blob);
    },
    get: async (draftId, mediaId) =>
      blobs.get(mediaKey(draftId, mediaId)) ?? null,
    deleteDraft: async (draftId) => {
      for (const key of blobs.keys()) {
        if (key.startsWith(`${draftId}:`)) {
          blobs.delete(key);
        }
      }
    },
    clear: async () => {
      blobs.clear();
    },
  };
}

export function createMemoryLocalStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

type MediaBlobRecord = {
  key: string;
  draftId: string;
  mediaId: string;
  blob: Blob;
};

function mediaKey(draftId: string, mediaId: string): string {
  return `${draftId}:${mediaId}`;
}

function openBuilderDraftDb(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_BLOB_STORE)) {
        db.createObjectStore(MEDIA_BLOB_STORE, { keyPath: 'key' });
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
    const request = store.openCursor();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }

      const record = cursor.value as MediaBlobRecord;
      if (record.draftId === draftId) {
        cursor.delete();
      }
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
