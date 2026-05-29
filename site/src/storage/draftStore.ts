import {
  DRAFT_STORAGE_KEY,
  DRAFT_STEPS,
  DEFAULT_DRAFT_STEP,
  type Draft,
  type DraftMedia,
  type DraftMediaInput,
  type DraftPublishCheckpoint,
  type DraftStatus,
  type DraftStep,
  type DraftStorage,
  type DraftStorageOptions,
} from './draftTypes';
import { createIndexedDbDraftLocalMediaStore } from './draftLocalMediaStore';
import { validateDraftMediaFile } from './draftMediaValidation';

export function createDraftStorage(
  options: DraftStorageOptions = {},
): DraftStorage {
  const storage = options.localStorage ?? globalThis.localStorage;
  const localMediaStore =
    options.localMediaStore ?? createIndexedDbDraftLocalMediaStore();
  const now = options.now ?? (() => new Date());
  const draftLocks = new Map<string, Promise<void>>();

  function readDrafts(): Record<string, Draft> {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createDraftRecord();

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        return createDraftRecord();
      }

      const drafts = createDraftRecord();
      for (const [draftId, draft] of Object.entries(parsed)) {
        drafts[draftId] = normalizeDraft(draftId, draft);
      }
      return drafts;
    } catch {
      return createDraftRecord();
    }
  }

  function writeDrafts(drafts: Record<string, Draft>): void {
    if (Object.keys(drafts).length === 0) {
      storage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }

  async function saveDraft(draft: Draft): Promise<Draft> {
    const drafts = readDrafts();
    drafts[draft.id] = draft;
    writeDrafts(drafts);
    return draft;
  }

  async function getDraft(draftId: string): Promise<Draft | null> {
    return getOwnDraft(readDrafts(), draftId);
  }

  async function listDrafts(): Promise<Draft[]> {
    return Object.values(readDrafts()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async function updateDraftFields(
    draftId: string,
    fields: Record<string, unknown>,
  ): Promise<Draft> {
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
    currentStep: DraftStep,
  ): Promise<Draft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      currentStep,
      updatedAt: now().toISOString(),
    }));
  }

  async function completeDraftStep(
    draftId: string,
    completedStep: DraftStep,
    nextStep?: DraftStep,
  ): Promise<Draft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      currentStep: nextStep ?? draft.currentStep,
      completedSteps: addCompletedStep(draft.completedSteps, completedStep),
      updatedAt: now().toISOString(),
    }));
  }

  async function savePublishCheckpoint(
    draftId: string,
    checkpoint: DraftPublishCheckpoint,
  ): Promise<Draft> {
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
    input: DraftMediaInput,
    content: Blob,
  ): Promise<DraftMedia> {
    return withDraftLock(draftId, async () => {
      const drafts = readDrafts();
      const draft = getOwnDraft(drafts, draftId);
      if (!draft) {
        throw new Error(`Draft not found: ${draftId}`);
      }

      const contentMimeType = content.type.toLowerCase();
      const inputMimeType = input.mimeType?.toLowerCase();
      if (contentMimeType && inputMimeType && contentMimeType !== inputMimeType) {
        throw new Error(
          'Provided media MIME type does not match the local media content MIME type.',
        );
      }

      const mimeType = contentMimeType || inputMimeType || '';
      const validation = validateDraftMediaFile({
        kind: input.kind,
        file: content,
        mimeType,
      });
      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      const media: DraftMedia = {
        id: input.id,
        kind: input.kind,
        name: input.name,
        mimeType,
        size: content.size,
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
        await localMediaStore.put({
          draftId,
          mediaId: media.id,
          content,
        });
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

  async function getLocalMedia(
    draftId: string,
    mediaId: string,
  ): Promise<Blob | null> {
    return localMediaStore.get(draftId, mediaId);
  }

  async function deleteDraft(draftId: string): Promise<void> {
    await withDraftLock(draftId, async () => {
      await localMediaStore.deleteDraft(draftId);
      const drafts = readDrafts();
      delete drafts[draftId];
      writeDrafts(drafts);
    });
  }

  async function clearDrafts(): Promise<void> {
    await localMediaStore.clear();
    storage.removeItem(DRAFT_STORAGE_KEY);
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
    getLocalMedia,
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
    const queuedLock = previous.then(() => current);

    draftLocks.set(draftId, queuedLock);
    await previous;

    try {
      return await work();
    } finally {
      release();
      if (draftLocks.get(draftId) === queuedLock) {
        draftLocks.delete(draftId);
      }
    }
  }

  async function updateDraft(
    draftId: string,
    update: (draft: Draft) => Draft,
  ): Promise<Draft> {
    return withDraftLock(draftId, async () => {
      const drafts = readDrafts();
      const draft = getOwnDraft(drafts, draftId);
      if (!draft) {
        throw new Error(`Draft not found: ${draftId}`);
      }

      const updatedDraft = update(draft);
      drafts[draftId] = updatedDraft;
      writeDrafts(drafts);
      return updatedDraft;
    });
  }
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

function createDraftRecord(): Record<string, Draft> {
  return Object.create(null) as Record<string, Draft>;
}

function normalizeDraft(draftId: string, value: unknown): Draft {
  const draft =
    value && typeof value === 'object'
      ? (value as Partial<Draft>)
      : {};

  return {
    ...draft,
    id: typeof draft.id === 'string' ? draft.id : draftId,
    status: isDraftStatus(draft.status) ? draft.status : 'draft',
    currentStep: isDraftStep(draft.currentStep)
      ? draft.currentStep
      : DEFAULT_DRAFT_STEP,
    completedSteps: Array.isArray(draft.completedSteps)
      ? draft.completedSteps.filter(isDraftStep)
      : [],
    createdAt: typeof draft.createdAt === 'string' ? draft.createdAt : '',
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : '',
    fields:
      draft.fields && typeof draft.fields === 'object' ? draft.fields : {},
    media: Array.isArray(draft.media) ? draft.media : [],
  };
}

function addCompletedStep(
  completedSteps: DraftStep[],
  completedStep: DraftStep,
): DraftStep[] {
  return completedSteps.includes(completedStep)
    ? completedSteps
    : [...completedSteps, completedStep];
}

function isDraftStatus(
  status: unknown,
): status is DraftStatus {
  return (
    status === 'draft' ||
    status === 'ready-to-publish' ||
    status === 'published'
  );
}

function isDraftStep(step: unknown): step is DraftStep {
  return (
    typeof step === 'string' &&
    DRAFT_STEPS.includes(step as DraftStep)
  );
}

function getOwnDraft(
  drafts: Record<string, Draft>,
  draftId: string,
): Draft | null {
  return Object.prototype.hasOwnProperty.call(drafts, draftId)
    ? drafts[draftId]
    : null;
}
