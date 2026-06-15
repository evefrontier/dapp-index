import { useEffect, useId } from 'react';
import { ReviewIssueList } from './ReviewIssueList';
import type { RegistrationDraftReviewIssue } from './registrationDraftReview';

export function ReviewWarningsModal({
  issues,
  onClose,
  open,
}: {
  issues: readonly RegistrationDraftReviewIssue[];
  onClose: () => void;
  open: boolean;
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

  if (!open || issues.length === 0) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="builder-review-modal-backdrop"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="builder-review-modal-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="builder-review-modal-header">
          <h3 className="text-sm" id={titleId}>
            Review warnings
          </h3>
          <button className="builder-text-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="builder-review-advanced-hint">
          These items are optional. You can publish without fixing them.
        </p>

        <ReviewIssueList
          issues={issues}
          listClassName="builder-review-modal-list"
          itemClassName="builder-review-modal-item"
        />
      </div>
    </div>
  );
}
