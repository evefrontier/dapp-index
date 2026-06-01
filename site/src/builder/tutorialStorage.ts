export const BUILDER_TUTORIAL_STORAGE_KEY =
  'dapp-index:builder:tutorial-skipped:v1';

type BuilderTutorialStorageOptions = {
  localStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
};

export function getBuilderTutorialSkipped(
  options: BuilderTutorialStorageOptions = {},
): boolean {
  const storage = options.localStorage ?? globalThis.localStorage;
  return storage.getItem(BUILDER_TUTORIAL_STORAGE_KEY) === 'true';
}

export function setBuilderTutorialSkipped(
  skipped: boolean,
  options: BuilderTutorialStorageOptions = {},
): void {
  const storage = options.localStorage ?? globalThis.localStorage;
  if (skipped) {
    storage.setItem(BUILDER_TUTORIAL_STORAGE_KEY, 'true');
    return;
  }

  storage.removeItem(BUILDER_TUTORIAL_STORAGE_KEY);
}
