import { BuilderDialog } from './BuilderDialog';
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
  if (!media || !previewUrl) return null;

  return (
    <BuilderDialog
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      open
      panelClassName="grid max-h-full w-full max-w-5xl gap-3 border border-(--color-neutral-30) bg-(--color-crude) p-4"
      title={media.name}
      onClose={onClose}
    >
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
    </BuilderDialog>
  );
}
