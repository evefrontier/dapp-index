import { Button } from '@evefrontier/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { ReviewIssueList } from './ReviewIssueList';
import { ReviewWarningsModal } from './ReviewWarningsModal';
import type { RegistrationDraftReview } from './registrationDraftReview';
import {
  getSlugCheckPresentation,
  type RegistrationDraftSlugCheckState,
  type ReviewTone,
} from './registrationDraftSlugCheck';
import {
  getHashPresentation,
  getReadinessPresentation,
  getReviewIssueCounts,
  getSchemaPresentation,
  type RegistrationDraftMetadataHashPreview,
} from './reviewStepPresentation';

export type ReviewStepScreenProps = {
  metadataHashPreview: RegistrationDraftMetadataHashPreview;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  onCheckSlug: () => Promise<void>;
};

export function ReviewStepScreen({
  metadataHashPreview,
  review,
  slugCheck,
  onCheckSlug,
}: ReviewStepScreenProps) {
  const [warningsOpen, setWarningsOpen] = useState(false);
  const prettyMetadataJson = JSON.stringify(review.metadata, null, 2);
  const warningIssues = review.issues.filter(
    (issue) => issue.severity === 'warning',
  );

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
  review,
  slugCheck,
  onCheckSlug,
}: ReviewStepScreenProps & { onViewWarnings: () => void }) {
  const issueCounts = getReviewIssueCounts(review);
  const readiness = getReadinessPresentation(issueCounts);
  const schema = getSchemaPresentation(review);
  const slugPresentation = getSlugCheckPresentation(slugCheck);
  const hash = getHashPresentation(metadataHashPreview);

  return (
    <div className="grid border-y border-(--color-neutral-20)">
      <ReviewStatusRow
        action={
          issueCounts.warnings > 0 ? (
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
        detail={readiness.detail}
        label={readiness.label}
        status={readiness.status}
        tone={readiness.tone}
      />
      <ReviewStatusRow
        detail={schema.detail}
        label={schema.label}
        status={schema.status}
        tone={schema.tone}
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
            {slugPresentation.button}
          </Button>
        }
        detail={slugPresentation.detail}
        label="Slug"
        status={slugPresentation.status}
        tone={slugPresentation.tone}
      />
      <ReviewStatusRow
        detail={hash.detail}
        label={hash.label}
        status={hash.status}
        tone={hash.tone}
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
