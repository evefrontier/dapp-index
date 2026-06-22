import { Button } from '@evefrontier/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { ReviewIssueList } from './ReviewIssueList';
import { ReviewWarningsModal } from './ReviewWarningsModal';
import type { RegistrationDraftReview } from './registrationDraftReview';
import type { ReviewTone } from './registrationDraftSlugCheck';
import {
  getReviewStatusRows,
  getWarningIssues,
  type ReviewStepControllerState,
} from './reviewStepPresentation';

export type ReviewStepScreenProps = ReviewStepControllerState;

export function ReviewStepScreen({
  metadataHashPreview,
  onCheckSlug,
  review,
  slugCheck,
}: ReviewStepScreenProps) {
  const [warningsOpen, setWarningsOpen] = useState(false);
  const prettyMetadataJson = JSON.stringify(review.metadata, null, 2);
  const warningIssues = getWarningIssues(review);

  useEffect(() => {
    void onCheckSlug();
  }, [onCheckSlug]);

  return (
    <div className="grid gap-5">
      <ReviewStatusRows
        metadataHashPreview={metadataHashPreview}
        review={review}
        slugCheck={slugCheck}
        onCheckSlug={onCheckSlug}
        onViewWarnings={() => setWarningsOpen(true)}
      />

      <ReviewIssues issues={review.issues} />
      <ReviewJsonPreview
        canonicalJson={review.canonicalJson}
        prettyMetadataJson={prettyMetadataJson}
      />
      <ReviewWarningsModal
        issues={warningIssues}
        open={warningsOpen}
        onClose={() => setWarningsOpen(false)}
      />
    </div>
  );
}

function ReviewStatusRows({
  metadataHashPreview,
  onViewWarnings,
  onCheckSlug,
  review,
  slugCheck,
}: ReviewStepScreenProps & { onViewWarnings: () => void }) {
  const statusRows = getReviewStatusRows(review, slugCheck, metadataHashPreview);

  return (
    <div className="grid border-y border-(--color-neutral-20)">
      <ReviewStatusRow
        action={
          statusRows.issueCounts.warnings > 0 ? (
            <Button
              size="small"
              type="button"
              variant="secondary"
              onClick={onViewWarnings}
            >
              View warnings
            </Button>
          ) : undefined
        }
        detail={statusRows.readiness.detail}
        label={statusRows.readiness.label}
        status={statusRows.readiness.status}
        tone={statusRows.readiness.tone}
      />
      <ReviewStatusRow
        detail={statusRows.schema.detail}
        label={statusRows.schema.label}
        status={statusRows.schema.status}
        tone={statusRows.schema.tone}
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
            {statusRows.slug.button}
          </Button>
        }
        detail={statusRows.slug.detail}
        label="Slug"
        status={statusRows.slug.status}
        tone={statusRows.slug.tone}
      />
      <ReviewStatusRow
        detail={statusRows.hash.detail}
        label={statusRows.hash.label}
        status={statusRows.hash.status}
        tone={statusRows.hash.tone}
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

  if (blockingIssues.length === 0) return null;

  return (
    <ReviewIssueList heading="Missing fields" issues={blockingIssues} />
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
      <details className="builder-review-advanced">
        <summary className="builder-review-advanced-summary">
          Show extra details
        </summary>
        <CodePreview
          description="Sorted, compact form used to compute the metadata hash."
          label="Canonical JSON"
          value={canonicalJson}
        />
      </details>
    </div>
  );
}

function CodePreview({
  description,
  label,
  value,
}: {
  description?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm">{label}</h3>
      {description ? (
        <p className="builder-review-advanced-hint">{description}</p>
      ) : null}
      <pre className="builder-review-code">{value}</pre>
    </div>
  );
}
