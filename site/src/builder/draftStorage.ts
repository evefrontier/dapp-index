export const BUILDER_DRAFTS_STORAGE_KEY = 'dapp-index:builder-drafts:v1';
export const MAX_BUILDER_DRAFT_SCREENSHOT_BYTES = 10 * 1024 * 1024;
export const MAX_BUILDER_DRAFT_VIDEO_BYTES = 100 * 1024 * 1024;
export const BUILDER_DRAFT_STEPS = [
  'profile',
  'metadata',
  'media',
  'packages',
  'review',
  'walrus-upload',
  'sui-register',
] as const;
const DEFAULT_BUILDER_DRAFT_STEP: BuilderDraftStep = 'profile';

const INDEXED_DB_NAME = 'dapp-index-builder-drafts';
const INDEXED_DB_VERSION = 2;
const MEDIA_BLOB_STORE = 'mediaBlobs';
const MEDIA_BLOB_DRAFT_ID_INDEX = 'byDraftId';

export type BuilderDraftStatus = 'draft' | 'ready-to-publish' | 'published';

export type BuilderDraftStep = (typeof BUILDER_DRAFT_STEPS)[number];

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

export type BuilderDraftPublishCheckpoint = {
  walrusBlobId?: string;
  walrusUrl?: string;
  metadataHash?: string;
  suiTransactionDigest?: string;
};

export type BuilderDraft = {
  id: string;
  status: BuilderDraftStatus;
  currentStep: BuilderDraftStep;
  completedSteps: BuilderDraftStep[];
  publish?: BuilderDraftPublishCheckpoint;
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
  updateDraftFields(
    draftId: string,
    fields: Record<string, unknown>,
  ): Promise<BuilderDraft>;
  setDraftStep(
    draftId: string,
    currentStep: BuilderDraftStep,
  ): Promise<BuilderDraft>;
  completeDraftStep(
    draftId: string,
    completedStep: BuilderDraftStep,
    nextStep?: BuilderDraftStep,
  ): Promise<BuilderDraft>;
  savePublishCheckpoint(
    draftId: string,
    checkpoint: BuilderDraftPublishCheckpoint,
  ): Promise<BuilderDraft>;
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

export type BuilderDraftAutosaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'error';

export type BuilderDraftAutosaveOptions = {
  storage: BuilderDraftStorage;
  draftId: string;
  delayMs?: number;
  setTimeout?: (
    callback: () => void | Promise<void>,
    delayMs: number,
  ) => unknown;
  clearTimeout?: (timerId: unknown) => void;
  onStatusChange?: (status: BuilderDraftAutosaveStatus) => void;
};

export type BuilderDraftAutosave = {
  updateFields(fields: Record<string, unknown>): void;
  flush(): Promise<BuilderDraft | null>;
  cancel(): void;
  getStatus(): BuilderDraftAutosaveStatus;
  getError(): unknown;
};

export function createBuilderDraftStorage(
  options: BuilderDraftStorageOptions = {},
): BuilderDraftStorage {
  const storage = options.localStorage ?? globalThis.localStorage;
  const mediaStore =
    options.mediaStore ?? createIndexedDbBuilderDraftMediaStore();
  const now = options.now ?? (() => new Date());
  const draftLocks = new Map<string, Promise<void>>();

  function readDrafts(): Record<string, BuilderDraft> {
    const raw = storage.getItem(BUILDER_DRAFTS_STORAGE_KEY);
    if (!raw) return createDraftRecord();

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        return createDraftRecord();
      }

      const drafts = createDraftRecord();
      for (const [draftId, draft] of Object.entries(parsed)) {
        drafts[draftId] = normalizeBuilderDraft(draftId, draft);
      }
      return drafts;
    } catch {
      return createDraftRecord();
    }
  }

  function writeDrafts(drafts: Record<string, BuilderDraft>): void {
    if (Object.keys(drafts).length === 0) {
      storage.removeItem(BUILDER_DRAFTS_STORAGE_KEY);
      return;
    }

    storage.setItem(BUILDER_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }

  async function saveDraft(draft: BuilderDraft): Promise<BuilderDraft> {
    const drafts = readDrafts();
    drafts[draft.id] = draft;
    writeDrafts(drafts);
    return draft;
  }

  async function getDraft(draftId: string): Promise<BuilderDraft | null> {
    return getOwnDraft(readDrafts(), draftId);
  }

  async function listDrafts(): Promise<BuilderDraft[]> {
    return Object.values(readDrafts()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async function updateDraftFields(
    draftId: string,
    fields: Record<string, unknown>,
  ): Promise<BuilderDraft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      fields: {
        ...draft.fields,
        ...fields,
      },
      updatedAt: now().toISOString(),
    }));
  }

  async function setDraftStep(
    draftId: string,
    currentStep: BuilderDraftStep,
  ): Promise<BuilderDraft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      currentStep,
      updatedAt: now().toISOString(),
    }));
  }

  async function completeDraftStep(
    draftId: string,
    completedStep: BuilderDraftStep,
    nextStep?: BuilderDraftStep,
  ): Promise<BuilderDraft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      currentStep: nextStep ?? draft.currentStep,
      completedSteps: addCompletedStep(draft.completedSteps, completedStep),
      updatedAt: now().toISOString(),
    }));
  }

  async function savePublishCheckpoint(
    draftId: string,
    checkpoint: BuilderDraftPublishCheckpoint,
  ): Promise<BuilderDraft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      publish: {
        ...draft.publish,
        ...checkpoint,
      },
      updatedAt: now().toISOString(),
    }));
  }

  async function saveMedia(
    draftId: string,
    input: BuilderDraftMediaInput,
    blob: Blob,
  ): Promise<BuilderDraftMedia> {
    return withDraftLock(draftId, async () => {
      const drafts = readDrafts();
      const draft = getOwnDraft(drafts, draftId);
      if (!draft) {
        throw new Error(`Builder draft not found: ${draftId}`);
      }

      const blobMimeType = blob.type.toLowerCase();
      const inputMimeType = input.mimeType?.toLowerCase();
      if (blobMimeType && inputMimeType && blobMimeType !== inputMimeType) {
        throw new Error(
          'Provided media MIME type does not match the blob MIME type.',
        );
      }

      const mimeType = blobMimeType || inputMimeType || '';
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

      const previousDraft = draft;
      drafts[draftId] = {
        ...draft,
        updatedAt: now().toISOString(),
        media: [...draft.media.filter((item) => item.id !== media.id), media],
      };
      writeDrafts(drafts);

      try {
        await mediaStore.put({ draftId, mediaId: media.id, blob });
      } catch (error) {
        const rollbackDrafts = readDrafts();
        const rollbackDraft = getOwnDraft(rollbackDrafts, draftId);
        if (rollbackDraft) {
          rollbackDrafts[draftId] = previousDraft;
          writeDrafts(rollbackDrafts);
        }
        throw error;
      }

      return media;
    });
  }

  async function getMediaBlob(
    draftId: string,
    mediaId: string,
  ): Promise<Blob | null> {
    return mediaStore.get(draftId, mediaId);
  }

  async function deleteDraft(draftId: string): Promise<void> {
    await withDraftLock(draftId, async () => {
      await mediaStore.deleteDraft(draftId);
      const drafts = readDrafts();
      delete drafts[draftId];
      writeDrafts(drafts);
    });
  }

  async function clearDrafts(): Promise<void> {
    await mediaStore.clear();
    storage.removeItem(BUILDER_DRAFTS_STORAGE_KEY);
  }

  return {
    saveDraft,
    getDraft,
    listDrafts,
    updateDraftFields,
    setDraftStep,
    completeDraftStep,
    savePublishCheckpoint,
    saveMedia,
    getMediaBlob,
    deleteDraft,
    clearPublishedDraft: deleteDraft,
    clearDrafts,
  };

  async function withDraftLock<T>(
    draftId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const previous = draftLocks.get(draftId) ?? Promise.resolve();
    let release = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    draftLocks.set(draftId, previous.then(() => current));
    await previous;

    try {
      return await work();
    } finally {
      release();
    }
  }

  async function updateDraft(
    draftId: string,
    update: (draft: BuilderDraft) => BuilderDraft,
  ): Promise<BuilderDraft> {
    return withDraftLock(draftId, async () => {
      const drafts = readDrafts();
      const draft = getOwnDraft(drafts, draftId);
      if (!draft) {
        throw new Error(`Builder draft not found: ${draftId}`);
      }

      const updatedDraft = update(draft);
      drafts[draftId] = updatedDraft;
      writeDrafts(drafts);
      return updatedDraft;
    });
  }
}

export function createBuilderDraftAutosave(
  options: BuilderDraftAutosaveOptions,
): BuilderDraftAutosave {
  const delayMs = options.delayMs ?? 750;
  const setTimeoutFn =
    options.setTimeout ??
    ((callback: () => void | Promise<void>, timeoutMs: number) =>
      globalThis.setTimeout(callback, timeoutMs));
  const clearTimeoutFn =
    options.clearTimeout ??
    ((timerId: unknown) => {
      globalThis.clearTimeout(
        timerId as ReturnType<typeof globalThis.setTimeout>,
      );
    });

  let pendingFields: Record<string, unknown> = {};
  let timerId: unknown = null;
  let status: BuilderDraftAutosaveStatus = 'idle';
  let error: unknown;
  let savingPromise: Promise<BuilderDraft | null> | null = null;

  function updateFields(fields: Record<string, unknown>): void {
    if (Object.keys(fields).length === 0) return;

    pendingFields = {
      ...pendingFields,
      ...fields,
    };
    error = undefined;
    scheduleSave();
    setStatus('pending');
  }

  async function flush(): Promise<BuilderDraft | null> {
    clearScheduledSave();

    if (savingPromise) {
      await savingPromise;
      return hasPendingFields()
        ? flush()
        : options.storage.getDraft(options.draftId);
    }

    if (!hasPendingFields()) {
      return options.storage.getDraft(options.draftId);
    }

    const fieldsToSave = pendingFields;
    pendingFields = {};
    error = undefined;
    setStatus('saving');

    savingPromise = options.storage
      .updateDraftFields(options.draftId, fieldsToSave)
      .then((draft) => {
        savingPromise = null;
        if (hasPendingFields()) {
          setStatus('pending');
          return flush();
        }

        setStatus('saved');
        return draft;
      })
      .catch((caughtError: unknown) => {
        savingPromise = null;
        pendingFields = {
          ...fieldsToSave,
          ...pendingFields,
        };
        error = caughtError;
        setStatus('error');
        throw caughtError;
      });

    return savingPromise;
  }

  function cancel(): void {
    clearScheduledSave();
    pendingFields = {};
    error = undefined;
    setStatus('idle');
  }

  function getStatus(): BuilderDraftAutosaveStatus {
    return status;
  }

  function getError(): unknown {
    return error;
  }

  function scheduleSave(): void {
    clearScheduledSave();
    timerId = setTimeoutFn(async () => {
      try {
        await flush();
      } catch {
        // Error state and retry fields are recorded by flush().
      }
    }, delayMs);
  }

  function clearScheduledSave(): void {
    if (timerId === null) return;

    clearTimeoutFn(timerId);
    timerId = null;
  }

  function hasPendingFields(): boolean {
    return Object.keys(pendingFields).length > 0;
  }

  function setStatus(nextStatus: BuilderDraftAutosaveStatus): void {
    if (nextStatus === status) return;

    status = nextStatus;
    options.onStatusChange?.(status);
  }

  return {
    updateFields,
    flush,
    cancel,
    getStatus,
    getError,
  };
}

export function validateBuilderDraftMediaFile(input: {
  kind: BuilderDraftMediaKind;
  file: Blob;
  mimeType?: string;
}): BuilderDraftMediaValidation {
  const mimeType = (input.mimeType ?? input.file.type).toLowerCase();

  if (input.kind === 'video') {
    if (mimeType !== 'video/webm') {
      return { ok: false, reason: 'Only video/webm videos are supported.' };
    }

    if (input.file.size > MAX_BUILDER_DRAFT_VIDEO_BYTES) {
      return {
        ok: false,
        reason: `Videos must be ${formatBytes(MAX_BUILDER_DRAFT_VIDEO_BYTES)} or smaller.`,
      };
    }

    return { ok: true };
  }

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    return {
      ok: false,
      reason: 'Screenshots must be PNG, JPEG, or WebP images.',
    };
  }

  if (input.file.size > MAX_BUILDER_DRAFT_SCREENSHOT_BYTES) {
    return {
      ok: false,
      reason: `Screenshots must be ${formatBytes(MAX_BUILDER_DRAFT_SCREENSHOT_BYTES)} or smaller.`,
    };
  }

  return { ok: true };
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
  return `${encodeURIComponent(draftId)}:${encodeURIComponent(mediaId)}`;
}

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function openBuilderDraftDb(indexedDb: IDBFactory): Promise<IDBDatabase> {
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

function createDraftRecord(): Record<string, BuilderDraft> {
  return Object.create(null) as Record<string, BuilderDraft>;
}

function normalizeBuilderDraft(draftId: string, value: unknown): BuilderDraft {
  const draft =
    value && typeof value === 'object'
      ? (value as Partial<BuilderDraft>)
      : {};

  return {
    ...draft,
    id: typeof draft.id === 'string' ? draft.id : draftId,
    status: isBuilderDraftStatus(draft.status) ? draft.status : 'draft',
    currentStep: isBuilderDraftStep(draft.currentStep)
      ? draft.currentStep
      : DEFAULT_BUILDER_DRAFT_STEP,
    completedSteps: Array.isArray(draft.completedSteps)
      ? draft.completedSteps.filter(isBuilderDraftStep)
      : [],
    createdAt: typeof draft.createdAt === 'string' ? draft.createdAt : '',
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : '',
    fields:
      draft.fields && typeof draft.fields === 'object' ? draft.fields : {},
    media: Array.isArray(draft.media) ? draft.media : [],
  };
}

function addCompletedStep(
  completedSteps: BuilderDraftStep[],
  completedStep: BuilderDraftStep,
): BuilderDraftStep[] {
  return completedSteps.includes(completedStep)
    ? completedSteps
    : [...completedSteps, completedStep];
}

function isBuilderDraftStatus(
  status: unknown,
): status is BuilderDraftStatus {
  return (
    status === 'draft' ||
    status === 'ready-to-publish' ||
    status === 'published'
  );
}

function isBuilderDraftStep(step: unknown): step is BuilderDraftStep {
  return (
    typeof step === 'string' &&
    BUILDER_DRAFT_STEPS.includes(step as BuilderDraftStep)
  );
}

function getOwnDraft(
  drafts: Record<string, BuilderDraft>,
  draftId: string,
): BuilderDraft | null {
  return Object.prototype.hasOwnProperty.call(drafts, draftId)
    ? drafts[draftId]
    : null;
}
