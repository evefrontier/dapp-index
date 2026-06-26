import { useRef } from 'react';
import { getMediaStepGuideCopy } from './mediaRoleModel';

export type MediaStepGuideProps = {
  mediaItemCount: number;
};

export function MediaStepGuide({ mediaItemCount }: MediaStepGuideProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guidance = getMediaStepGuideCopy(mediaItemCount);

  return (
    <>
      <button
        type="button"
        className="builder-text-button"
        onClick={() => {
          dialogRef.current?.showModal();
        }}
      >
        Media guide
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="builder-media-guide-title"
        className="builder-info-dialog"
        onClick={(event) => {
          const panel = event.currentTarget.querySelector(
            '.builder-info-dialog-panel',
          );
          if (panel && !panel.contains(event.target as Node)) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="builder-info-dialog-panel">
          <div className="space-y-4 text-sm text-(--color-neutral-60)">
            <h3
              className="text-base font-bold uppercase text-(--color-neutral)"
              id="builder-media-guide-title"
            >
              Local media
            </h3>
            {guidance.map((paragraph, index) => (
              <p
                key={index}
                className={index === 0 ? 'text-(--color-neutral)' : 'text-xs'}
              >
                {paragraph}
              </p>
            ))}
          </div>
          <form className="mt-4 flex justify-end" method="dialog">
            <button type="submit" className="builder-info-dialog-close">
              Close
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
