import type { RegistrationDraftReviewIssue } from './registrationDraftReview';

export function ReviewIssueList({
  heading,
  issues,
  listClassName = 'grid border-y border-(--color-neutral-20)',
  itemClassName = 'grid gap-1 border-t border-(--color-neutral-20) py-3 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)]',
}: {
  heading?: string;
  issues: readonly RegistrationDraftReviewIssue[];
  itemClassName?: string;
  listClassName?: string;
}) {
  if (issues.length === 0) return null;

  return (
    <div className="grid gap-3">
      {heading ? <h3 className="text-sm">{heading}</h3> : null}
      <ul className={listClassName}>
        {issues.map((issue) => (
          <li key={`${issue.id}:${issue.message}`} className={itemClassName}>
            <p className="builder-review-issue" data-severity={issue.severity}>
              {issue.label}
            </p>
            <p className="text-sm text-(--color-neutral)">{issue.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
