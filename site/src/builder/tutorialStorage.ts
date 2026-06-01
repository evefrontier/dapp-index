export const BUILDER_TUTORIAL_STORAGE_KEY =
  'dapp-index:builder:tutorial-skipped:v1';

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type BuilderTutorialPreference = {
  skipped: boolean;
};

export type BuilderTutorialPreferenceOptions = {
  storage?: BrowserStorage;
};

export const builderTutorialPreference = {
  read(
    options: BuilderTutorialPreferenceOptions = {},
  ): BuilderTutorialPreference {
    return {
      skipped: readSkipPreference(resolveStorage(options)),
    };
  },
  skip(options: BuilderTutorialPreferenceOptions = {}): void {
    persistSkipPreference(true, resolveStorage(options));
  },
  show(options: BuilderTutorialPreferenceOptions = {}): void {
    persistSkipPreference(false, resolveStorage(options));
  },
};

function readSkipPreference(storage: BrowserStorage | null): boolean {
  if (!storage) return false;

  try {
    return storage.getItem(BUILDER_TUTORIAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistSkipPreference(
  skipped: boolean,
  storage: BrowserStorage | null,
): void {
  if (!storage) return;

  try {
    if (skipped) {
      storage.setItem(BUILDER_TUTORIAL_STORAGE_KEY, 'true');
      return;
    }

    storage.removeItem(BUILDER_TUTORIAL_STORAGE_KEY);
  } catch {
    // Tutorial visibility is a non-critical preference.
  }
}

function resolveStorage(
  options: BuilderTutorialPreferenceOptions,
): BrowserStorage | null {
  if (options.storage) return options.storage;

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
