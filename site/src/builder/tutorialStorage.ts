export const TUTORIAL_STORAGE_KEY =
  'dapp-index:builder:tutorial-skipped:v1';

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type TutorialPreference = {
  skipped: boolean;
};

export type TutorialPreferenceOptions = {
  storage?: BrowserStorage;
};

export const tutorialPreference = {
  read(
    options: TutorialPreferenceOptions = {},
  ): TutorialPreference {
    return {
      skipped: readSkipPreference(resolveStorage(options)),
    };
  },
  skip(options: TutorialPreferenceOptions = {}): void {
    persistSkipPreference(true, resolveStorage(options));
  },
  show(options: TutorialPreferenceOptions = {}): void {
    persistSkipPreference(false, resolveStorage(options));
  },
};

function readSkipPreference(storage: BrowserStorage | null): boolean {
  if (!storage) return false;

  try {
    return storage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
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
      storage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      return;
    }

    storage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // Tutorial visibility is a non-critical preference.
  }
}

function resolveStorage(
  options: TutorialPreferenceOptions,
): BrowserStorage | null {
  if (options.storage) return options.storage;

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
