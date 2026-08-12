import { useEffect, useId } from 'react';
import type { DraftMedia } from '@/storage/draftStorage';

export function MediaPreviewModal({
  media,
  previewUrl,
  onClose,
}: {
  media: DraftMedia | null;
  previewUrl: string | null;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!media) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, onClose]);

  if (!media || !previewUrl) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
    >
      <div className="grid max-h-full w-full max-w-5xl gap-3 border border-(--color-neutral-30) bg-(--color-crude) p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 break-words text-sm" id={titleId}>
            {media.name}
          </h3>
          <button type="button" className="builder-text-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex max-h-[75vh] min-h-0 items-center justify-center overflow-hidden bg-(--color-crude-60)">
          {media.kind === 'video' ? (
            <video
              className="max-h-[75vh] w-full object-contain"
              controls
              muted
              playsInline
              src={previewUrl}
            />
          ) : (
            <img
              alt={media.alt || media.name}
              className="max-h-[75vh] w-full object-contain"
              src={previewUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}
