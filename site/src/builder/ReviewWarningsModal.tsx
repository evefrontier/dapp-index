import { BuilderDialog } from './BuilderDialog';
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
  if (!open || issues.length === 0) return null;

  return (
    <BuilderDialog
      backdropClassName="builder-review-modal-backdrop"
      closeOnBackdropClick
      open
      panelClassName="builder-review-modal-panel grid gap-4"
      title="Review warnings"
      onClose={onClose}
    >
      <p className="builder-review-advanced-hint">
        These items are optional. You can publish without fixing them.
      </p>

      <ReviewIssueList
        issues={issues}
        listClassName="builder-review-modal-list"
        itemClassName="builder-review-modal-item"
      />
    </BuilderDialog>
  );
}
