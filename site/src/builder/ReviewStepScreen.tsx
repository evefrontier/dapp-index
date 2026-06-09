import { Button } from '@evefrontier/ui';
import type { ReactNode } from 'react';
import type {
  RegistrationDraftReview,
  RegistrationDraftReviewIssue,
  RegistrationDraftSlugCheckState,
} from './registrationDraftReview';

export type ReviewStepScreenProps = {
  metadataHashError: string | null;
  metadataHashHex: string | null;
  metadataHashPending: boolean;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  onCheckSlug: () => Promise<void>;
};

export function ReviewStepScreen({
  metadataHashError,
  metadataHashHex,
  metadataHashPending,
  review,
  slugCheck,
  onCheckSlug,
}: ReviewStepScreenProps) {
  const prettyMetadataJson = JSON.stringify(review.metadata, null, 2);

  return (
    <div className="grid gap-5">
      <ReviewStatusRows
        metadataHashError={metadataHashError}
        metadataHashHex={metadataHashHex}
        metadataHashPending={metadataHashPending}
        review={review}
        slugCheck={slugCheck}
        onCheckSlug={onCheckSlug}
      />

      <ReviewIssues issues={review.issues} />
      <ReviewJsonPreview
        canonicalJson={review.canonicalJson}
        prettyMetadataJson={prettyMetadataJson}
      />
    </div>
  );
}

function ReviewStatusRows({
  metadataHashError,
  metadataHashHex,
  metadataHashPending,
  review,
  slugCheck,
  onCheckSlug,
}: ReviewStepScreenProps) {
  const issueCounts = getReviewIssueCounts(review);

  return (
    <div className="grid border-y border-(--color-neutral-20)">
      <ReviewStatusRow
        detail={formatReadinessDetail(issueCounts)}
        label="Readiness"
        status={getReadinessStatusLabel(issueCounts)}
        tone={getReadinessTone(issueCounts)}
      />
      <ReviewStatusRow
        detail={
          review.schemaValidation.ok
            ? 'Matches registry-entry.schema.json.'
            : 'Schema validation found issues.'
        }
        label="Schema"
        status={review.schemaValidation.ok ? 'Valid' : 'Invalid'}
        tone={review.schemaValidation.ok ? 'ready' : 'error'}
      />
      <ReviewStatusRow
        action={
          <Button
            disabled={slugCheck.status === 'checking'}
            size="small"
            type="button"
            variant="secondary"
            onClick={() => {
              void onCheckSlug();
            }}
          >
            Check slug
          </Button>
        }
        detail={slugCheck.message}
        label="Slug"
        status={getSlugCheckStatusLabel(slugCheck)}
        tone={getSlugCheckTone(slugCheck)}
      />
      <ReviewStatusRow
        detail={metadataHashHex ?? metadataHashError ?? 'Building preview.'}
        label="Hash"
        status={
          metadataHashHex
            ? 'Ready'
            : metadataHashPending
              ? 'Building'
              : 'Unavailable'
        }
        tone={metadataHashError ? 'error' : metadataHashHex ? 'ready' : 'muted'}
      />
    </div>
  );
}

function ReviewStatusRow({
  action,
  detail,
  label,
  status,
  tone,
}: {
  action?: ReactNode;
  detail: string;
  label: string;
  status: string;
  tone: ReviewTone;
}) {
  return (
    <div className="grid gap-3 border-t border-(--color-neutral-20) py-3 first:border-t-0 md:grid-cols-[8rem_8rem_minmax(0,1fr)_auto] md:items-center">
      <p className="builder-review-label">{label}</p>
      <p className="builder-review-status" data-tone={tone}>
        {status}
      </p>
      <p className="min-w-0 break-words text-sm text-(--color-neutral)">
        {detail}
      </p>
      {action ? <div className="justify-self-start">{action}</div> : null}
    </div>
  );
}

function ReviewIssues({
  issues,
}: {
  issues: RegistrationDraftReview['issues'];
}) {
  const blockingIssues = issues.filter((issue) => issue.severity === 'error');
  const warningIssues = issues.filter((issue) => issue.severity === 'warning');

  if (blockingIssues.length === 0 && warningIssues.length === 0) {
    return (
      <div className="border-b border-(--color-neutral-20) pb-4">
        <h4>No review notes.</h4>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <ReviewIssueList heading="Missing fields" issues={blockingIssues} />
      <ReviewIssueList heading="Warnings" issues={warningIssues} />
    </div>
  );
}

function ReviewIssueList({
  heading,
  issues,
}: {
  heading: string;
  issues: RegistrationDraftReviewIssue[];
}) {
  if (issues.length === 0) return null;

  return (
    <div className="grid gap-3">
      <h3 className="text-sm">{heading}</h3>
      <ul className="grid border-y border-(--color-neutral-20)">
        {issues.map((issue) => (
          <li
            key={`${issue.id}:${issue.message}`}
            className="grid gap-1 border-t border-(--color-neutral-20) py-3 first:border-t-0 sm:grid-cols-[10rem_minmax(0,1fr)]"
          >
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

function ReviewJsonPreview({
  canonicalJson,
  prettyMetadataJson,
}: {
  canonicalJson: string;
  prettyMetadataJson: string;
}) {
  return (
    <div className="grid gap-4">
      <CodePreview label="Metadata JSON" value={prettyMetadataJson} />
      <CodePreview label="Canonical JSON" value={canonicalJson} />
    </div>
  );
}

function CodePreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm">{label}</h3>
      <pre className="max-h-80 overflow-auto border border-(--color-neutral-20) bg-(--color-crude-60) p-3 text-xs leading-relaxed text-(--color-neutral-70)">
        {value}
      </pre>
    </div>
  );
}

type ReviewTone = 'ready' | 'warning' | 'error' | 'muted';

function getSlugCheckStatusLabel(
  slugCheck: RegistrationDraftSlugCheckState,
): string {
  switch (slugCheck.status) {
    case 'idle':
      return 'Not checked';
    case 'checking':
      return 'Checking';
    case 'available':
      return 'Available';
    case 'taken':
      return 'Taken';
    case 'unconfigured':
      return 'Skipped';
    case 'error':
      return 'Error';
    default:
      return assertNever(slugCheck);
  }
}

function getSlugCheckTone(
  slugCheck: RegistrationDraftSlugCheckState,
): ReviewTone {
  switch (slugCheck.status) {
    case 'available':
      return 'ready';
    case 'taken':
    case 'error':
      return 'error';
    case 'idle':
    case 'checking':
    case 'unconfigured':
      return 'muted';
    default:
      return assertNever(slugCheck);
  }
}

function getReviewIssueCounts(review: RegistrationDraftReview): {
  blockers: number;
  warnings: number;
} {
  return review.issues.reduce(
    (counts, issue) => {
      if (issue.severity === 'error') counts.blockers += 1;
      if (issue.severity === 'warning') counts.warnings += 1;
      return counts;
    },
    { blockers: 0, warnings: 0 },
  );
}

function formatReadinessDetail({
  blockers,
  warnings,
}: {
  blockers: number;
  warnings: number;
}): string {
  if (blockers > 0) {
    return `${formatCount(blockers, 'blocker')} to fix.`;
  }

  if (warnings > 0) {
    return `Ready with ${formatCount(warnings, 'warning')}.`;
  }

  return 'Metadata is ready for publish.';
}

function getReadinessStatusLabel({
  blockers,
  warnings,
}: {
  blockers: number;
  warnings: number;
}): string {
  if (blockers > 0) return 'Needs work';
  if (warnings > 0) return 'Warnings';
  return 'Ready';
}

function getReadinessTone({
  blockers,
  warnings,
}: {
  blockers: number;
  warnings: number;
}): ReviewTone {
  if (blockers > 0) return 'error';
  if (warnings > 0) return 'warning';
  return 'ready';
}

function formatCount(count: number, label: string): string {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled review state: ${String(value)}`);
}
