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
    return flushPendingFields();
  }

  async function flushPendingFields(): Promise<Draft | null> {
    if (savingPromise) {
      return waitForInFlightSave();
    }

    if (!hasPendingFields()) {
      return options.storage.getDraft(options.draftId);
    }

    return startPendingSave();
  }

  async function waitForInFlightSave(): Promise<Draft | null> {
    await savingPromise;
    return hasPendingFields()
      ? flush()
      : options.storage.getDraft(options.draftId);
  }

  function startPendingSave(): Promise<Draft | null> {
    const fieldsToSave = takePendingFields();
    error = undefined;
    setStatus('saving');

    savingPromise = saveFields(fieldsToSave);
    return savingPromise;
  }

  function takePendingFields(): Record<string, unknown> {
    const fieldsToSave = pendingFields;
    pendingFields = {};
    return fieldsToSave;
  }

  async function saveFields(
    fieldsToSave: Record<string, unknown>,
  ): Promise<Draft | null> {
    try {
      const draft = await options.storage.updateDraftFields(
        options.draftId,
        fieldsToSave,
      );
      savingPromise = null;
      return finishSuccessfulSave(draft);
    } catch (caughtError) {
      savingPromise = null;
      restoreFailedFields(fieldsToSave, caughtError);
      throw caughtError;
    }
  }

  async function finishSuccessfulSave(draft: Draft): Promise<Draft | null> {
    if (hasPendingFields()) {
      setStatus('pending');
      return flush();
    }

    setStatus('saved');
    return draft;
  }

  function restoreFailedFields(
    fieldsToSave: Record<string, unknown>,
    caughtError: unknown,
  ): void {
    pendingFields = {
      ...fieldsToSave,
      ...pendingFields,
    };
    error = caughtError;
    setStatus('error');
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
