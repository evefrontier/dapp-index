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
      <p className="text-sm text-(--colors-neutral-60)">Loading catalog…</p>
    );
  }

  return (
    <p className="text-sm text-(--app-alert)">
      Failed to load catalog: {message}
    </p>
  );
}
