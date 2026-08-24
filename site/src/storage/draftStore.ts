import {
  DRAFT_STORAGE_KEY,
  DEFAULT_DRAFT_STEP,
  parseDraftStep,
  type Draft,
  type DraftMedia,
  type DraftMediaInput,
  type DraftMediaKind,
  type DraftMediaUpdate,
  type DraftPublishCheckpoint,
  type DraftStatus,
  type DraftStep,
  type DraftStorage,
  type DraftStorageOptions,
} from './draftTypes';
import {
  DAPP_INDEX_MEDIA_ROLES,
  type DappIndexMediaRole,
} from '@/types/dapp-index';
import { createIndexedDbDraftLocalMediaStore } from './draftLocalMediaStore';
import { validateDraftMediaFileForKind } from './draftMediaValidation';

/** Role assigned when another item takes thumbnail or logo exclusivity. */
const EXCLUSIVE_ROLE_DEMOTION_ROLE: DappIndexMediaRole = 'gallery';
const EXCLUSIVE_DRAFT_MEDIA_ROLES: ReadonlySet<DappIndexMediaRole> = new Set([
  'thumbnail',
  'logo',
]);
const DRAFT_MEDIA_ROLE_VALUES: ReadonlySet<string> = new Set(
  DAPP_INDEX_MEDIA_ROLES,
);

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

  async function finalizePublishedDraft(
    draftId: string,
    checkpoint: DraftPublishCheckpoint,
  ): Promise<Draft> {
    return updateDraft(draftId, (draft) => ({
      ...draft,
      status: 'published',
      currentStep: 'publish',
      completedSteps: addCompletedStep(draft.completedSteps, 'publish'),
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
      const { drafts, draft } = readRequiredDraft(draftId);
      const media = createDraftMedia(input, content);

      writeDraftWithMedia(drafts, draftId, draft, media);
      await putLocalMediaOrRollback(draftId, media.id, content, draft);

      return media;
    });
  }

  async function updateMedia(
    draftId: string,
    mediaId: string,
    input: DraftMediaUpdate,
  ): Promise<Draft> {
    return updateDraft(draftId, (draft) => {
      let didFindMedia = false;
      const roleToMakeExclusive =
        input.role && isExclusiveMediaRole(input.role) ? input.role : null;
      const media = draft.media.map((item) => {
        if (item.id === mediaId) {
          didFindMedia = true;
          return updateDraftMedia(item, input);
        }

        if (roleToMakeExclusive && item.role === roleToMakeExclusive) {
          return { ...item, role: EXCLUSIVE_ROLE_DEMOTION_ROLE };
        }

        return item;
      });

      if (!didFindMedia) {
        throw new Error(`Draft media not found: ${mediaId}`);
      }

      return {
        ...draft,
        media,
        updatedAt: now().toISOString(),
      };
    });
  }

  async function deleteMedia(
    draftId: string,
    mediaId: string,
  ): Promise<Draft> {
    return withDraftLock(draftId, async () => {
      const { drafts, draft } = readRequiredDraft(draftId);
      const media = draft.media.filter((item) => item.id !== mediaId);
      if (media.length === draft.media.length) {
        throw new Error(`Draft media not found: ${mediaId}`);
      }

      const updatedDraft = {
        ...draft,
        media,
        updatedAt: now().toISOString(),
      };

      drafts[draftId] = updatedDraft;
      writeDrafts(drafts);

      try {
        await localMediaStore.delete(draftId, mediaId);
      } catch (error) {
        rollbackDraft(draftId, draft);
        throw error;
      }

      return updatedDraft;
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
    finalizePublishedDraft,
    saveMedia,
    updateMedia,
    deleteMedia,
    getLocalMedia,
    deleteDraft,
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

  function readRequiredDraft(draftId: string): {
    drafts: Record<string, Draft>;
    draft: Draft;
  } {
    const drafts = readDrafts();
    const draft = getOwnDraft(drafts, draftId);
    if (!draft) {
      throw new Error(`Draft not found: ${draftId}`);
    }

    return { drafts, draft };
  }

  function createDraftMedia(
    input: DraftMediaInput,
    content: Blob,
  ): DraftMedia {
    const mimeType = resolveMediaMimeType(input, content);
    const validation = validateDraftMediaFileForKind({
      kind: input.kind,
      file: content,
      mimeType,
    });
    if (!validation.ok) {
      throw new Error(validation.reason);
    }

    if (!input.role) {
      throw new Error('Draft media role is required.');
    }

    return {
      id: input.id,
      kind: input.kind,
      role: input.role,
      name: input.name,
      mimeType,
      size: content.size,
      createdAt: now().toISOString(),
      alt: normalizeOptionalMediaText(input.alt),
      caption: normalizeOptionalMediaText(input.caption),
    };
  }

  function resolveMediaMimeType(
    input: DraftMediaInput,
    content: Blob,
  ): string {
    const contentMimeType = content.type.toLowerCase();
    const inputMimeType = input.mimeType?.toLowerCase();
    if (contentMimeType && inputMimeType && contentMimeType !== inputMimeType) {
      throw new Error(
        'Provided media MIME type does not match the local media content MIME type.',
      );
    }

    return contentMimeType || inputMimeType || '';
  }

  function writeDraftWithMedia(
    drafts: Record<string, Draft>,
    draftId: string,
    draft: Draft,
    media: DraftMedia,
  ): void {
    drafts[draftId] = {
      ...draft,
      updatedAt: now().toISOString(),
      media: [...draft.media.filter((item) => item.id !== media.id), media],
    };
    writeDrafts(drafts);
  }

  function updateDraftMedia(
    media: DraftMedia,
    input: DraftMediaUpdate,
  ): DraftMedia {
    return {
      ...media,
      role: input.role ?? media.role,
      alt: Object.hasOwn(input, 'alt')
        ? normalizeOptionalMediaText(input.alt)
        : media.alt,
      caption: Object.hasOwn(input, 'caption')
        ? normalizeOptionalMediaText(input.caption)
        : media.caption,
    };
  }

  async function putLocalMediaOrRollback(
    draftId: string,
    mediaId: string,
    content: Blob,
    previousDraft: Draft,
  ): Promise<void> {
    try {
      await localMediaStore.put({ draftId, mediaId, content });
    } catch (error) {
      rollbackDraft(draftId, previousDraft);
      throw error;
    }
  }

  function rollbackDraft(draftId: string, previousDraft: Draft): void {
    const rollbackDrafts = readDrafts();
    const rollbackDraft = getOwnDraft(rollbackDrafts, draftId);
    if (!rollbackDraft) return;

    rollbackDrafts[draftId] = previousDraft;
    writeDrafts(rollbackDrafts);
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
  const currentStep = parseDraftStep(draft.currentStep);

  return {
    ...draft,
    id: typeof draft.id === 'string' ? draft.id : draftId,
    status: isDraftStatus(draft.status) ? draft.status : 'draft',
    currentStep: currentStep ?? DEFAULT_DRAFT_STEP,
    completedSteps: Array.isArray(draft.completedSteps)
      ? normalizeCompletedDraftSteps(draft.completedSteps)
      : [],
    createdAt: typeof draft.createdAt === 'string' ? draft.createdAt : '',
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : '',
    fields:
      draft.fields && typeof draft.fields === 'object' ? draft.fields : {},
    media: Array.isArray(draft.media)
      ? draft.media
          .map(normalizeDraftMedia)
          .filter((media): media is DraftMedia => Boolean(media))
      : [],
  };
}

function normalizeDraftMedia(value: unknown): DraftMedia | null {
  const media =
    value && typeof value === 'object'
      ? (value as Partial<DraftMedia>)
      : null;
  if (!media) return null;

  const id = typeof media.id === 'string' ? media.id : null;
  const kind = isDraftMediaKind(media.kind) ? media.kind : null;
  const name = typeof media.name === 'string' ? media.name : null;
  const mimeType = typeof media.mimeType === 'string' ? media.mimeType : null;
  const size =
    typeof media.size === 'number' &&
    Number.isFinite(media.size) &&
    media.size >= 0
      ? media.size
      : null;
  const role = isDappIndexMediaRole(media.role) ? media.role : null;
  const createdAt =
    typeof media.createdAt === 'string' ? media.createdAt : null;
  if (!id || !kind || !name || !mimeType || size === null || !createdAt || !role) {
    return null;
  }

  return {
    id,
    kind,
    role,
    name,
    mimeType,
    size,
    createdAt,
    alt: normalizeOptionalMediaText(media.alt),
    caption: normalizeOptionalMediaText(media.caption),
    walrusBlobId:
      typeof media.walrusBlobId === 'string' ? media.walrusBlobId : undefined,
    walrusUrl: typeof media.walrusUrl === 'string' ? media.walrusUrl : undefined,
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

function isDraftMediaKind(value: unknown): value is DraftMediaKind {
  return value === 'screenshot' || value === 'video';
}

function isDappIndexMediaRole(value: unknown): value is DappIndexMediaRole {
  return typeof value === 'string' && DRAFT_MEDIA_ROLE_VALUES.has(value);
}

function isExclusiveMediaRole(
  value: DappIndexMediaRole,
): value is 'thumbnail' | 'logo' {
  return EXCLUSIVE_DRAFT_MEDIA_ROLES.has(value);
}

function normalizeOptionalMediaText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeCompletedDraftSteps(steps: readonly unknown[]): DraftStep[] {
  const completedSteps: DraftStep[] = [];
  for (const step of steps) {
    const normalizedStep = parseDraftStep(step);
    if (!normalizedStep || completedSteps.includes(normalizedStep)) continue;
    completedSteps.push(normalizedStep);
  }
  return completedSteps;
}

function getOwnDraft(
  drafts: Record<string, Draft>,
  draftId: string,
): Draft | null {
  return Object.prototype.hasOwnProperty.call(drafts, draftId)
    ? drafts[draftId]
    : null;
}
