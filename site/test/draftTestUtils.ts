import {
  createDraftStorage,
  createMemoryDraftLocalMediaStore,
  createMemoryLocalStorage,
  type Draft,
  type DraftStorage,
  type DraftStorageOptions,
} from '../src/storage/draftStorage';

export const draft: Draft = {
  id: 'draft-1',
  status: 'draft',
  currentStep: 'profile',
  completedSteps: [],
  createdAt: '2026-05-18T12:00:00.000Z',
  updatedAt: '2026-05-18T12:00:00.000Z',
  fields: {
    id: 'frontier-map',
    name: 'Frontier Map',
  },
  media: [],
};

export function createTestDraftStorage(
  options: DraftStorageOptions = {},
): {
  storage: DraftStorage;
  localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
} {
  const localStorage = options.localStorage ?? createMemoryLocalStorage();
  const storage = createDraftStorage({
    ...options,
    localStorage,
    localMediaStore:
      options.localMediaStore ?? createMemoryDraftLocalMediaStore(),
  });

  return { storage, localStorage };
}

export function fileLike(input: { size: number; type: string }): Blob {
  return input as Blob;
}

export function createManualScheduler(): {
  setTimeout: (
    callback: () => void | Promise<void>,
    delayMs: number,
  ) => number;
  clearTimeout: (timerId: number) => void;
  pendingDelays: () => number[];
  runNext: () => Promise<void>;
} {
  const timers = new Map<
    number,
    { callback: () => void | Promise<void>; delayMs: number }
  >();
  let nextTimerId = 1;

  return {
    setTimeout: (callback, delayMs) => {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, { callback, delayMs });
      return timerId;
    },
    clearTimeout: (timerId) => {
      timers.delete(timerId);
    },
    pendingDelays: () =>
      Array.from(timers.values()).map((timer) => timer.delayMs),
    runNext: async () => {
      const [timerId, timer] = timers.entries().next().value ?? [];
      if (!timerId || !timer) return;

      timers.delete(timerId);
      await timer.callback();
    },
  };
}

export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}
