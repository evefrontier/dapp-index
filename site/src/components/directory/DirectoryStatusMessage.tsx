type DirectoryStatusMessageProps = {
  tone: 'loading' | 'error';
  message?: string;
};

export function DirectoryStatusMessage({
  tone,
  message,
}: DirectoryStatusMessageProps) {
  if (tone === 'loading') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-(--colors-neutral-60)">Loading catalog…</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-(--app-alert) bg-(--colors-crude-base) p-4">
      <p className="text-sm text-(--app-alert)">
        <span className="font-semibold">Failed to load catalog:</span> {message}
      </p>
    </div>
  );
}
