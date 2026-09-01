import { useEffect, useId, type ReactNode } from 'react';

export function BuilderDialog({
  backdropClassName,
  children,
  closeOnBackdropClick = false,
  onClose,
  open,
  panelClassName,
  title,
}: {
  backdropClassName: string;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  onClose: () => void;
  open: boolean;
  panelClassName: string;
  title: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={backdropClassName}
      role="dialog"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 break-words text-sm" id={titleId}>
            {title}
          </h3>
          <button className="builder-text-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
