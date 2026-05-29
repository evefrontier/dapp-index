import type { Draft, DraftStorage } from './draftTypes';

export type DraftAutosaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'error';

export type DraftAutosaveOptions = {
  storage: DraftStorage;
  draftId: string;
  delayMs?: number;
  setTimeout?: (
    callback: () => void | Promise<void>,
    delayMs: number,
  ) => unknown;
  clearTimeout?: (timerId: unknown) => void;
  onStatusChange?: (status: DraftAutosaveStatus) => void;
};

export type DraftAutosave = {
  updateFields(fields: Record<string, unknown>): void;
  flush(): Promise<Draft | null>;
  cancel(): void;
  getStatus(): DraftAutosaveStatus;
  getError(): unknown;
};

export function createDraftAutosave(
  options: DraftAutosaveOptions,
): DraftAutosave {
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
  let status: DraftAutosaveStatus = 'idle';
  let error: unknown;
  let savingPromise: Promise<Draft | null> | null = null;

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

  async function flush(): Promise<Draft | null> {
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

  function getStatus(): DraftAutosaveStatus {
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

  function setStatus(nextStatus: DraftAutosaveStatus): void {
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
