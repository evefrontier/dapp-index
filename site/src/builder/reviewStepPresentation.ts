import type { RegistrationDraftReview } from './registrationDraftReview';
import type { ReviewTone } from './registrationDraftSlugCheck';

export type ReviewStatusRowModel = {
  detail: string;
  label: string;
  status: string;
  tone: ReviewTone;
};

export type RegistrationDraftMetadataHashPreview = {
  error: string | null;
  hex: string | null;
  pending: boolean;
};

export type ReviewIssueCounts = {
  blockers: number;
  warnings: number;
};

export function getReviewIssueCounts(
  review: RegistrationDraftReview,
): ReviewIssueCounts {
  return review.issues.reduce(
    (counts, issue) => {
      if (issue.severity === 'error') counts.blockers += 1;
      if (issue.severity === 'warning') counts.warnings += 1;
      return counts;
    },
    { blockers: 0, warnings: 0 },
  );
}

export function getReadinessPresentation(
  counts: ReviewIssueCounts,
): ReviewStatusRowModel {
  if (counts.blockers > 0) {
    return {
      detail: `${formatCount(counts.blockers, 'blocker')} to fix.`,
      label: 'Readiness',
      status: 'Needs work',
      tone: 'error',
    };
  }

  if (counts.warnings > 0) {
    return {
      detail: `${formatCount(counts.warnings, 'optional improvement')}.`,
      label: 'Readiness',
      status: 'Ready',
      tone: 'ready',
    };
  }

  return {
    detail: 'Metadata is ready for publish.',
    label: 'Readiness',
    status: 'Ready',
    tone: 'ready',
  };
}

export function getSchemaPresentation(
  review: RegistrationDraftReview,
): ReviewStatusRowModel {
  if (review.schemaValidation.ok) {
    return {
      detail: 'Matches registry-entry.schema.json.',
      label: 'Schema',
      status: 'Valid',
      tone: 'ready',
    };
  }

  return {
    detail: 'Schema validation found issues.',
    label: 'Schema',
    status: 'Invalid',
    tone: 'error',
  };
}

export function getHashPresentation(
  preview: RegistrationDraftMetadataHashPreview,
): ReviewStatusRowModel {
  if (preview.error) {
    return {
      detail: preview.error,
      label: 'Hash',
      status: 'Unavailable',
      tone: 'error',
    };
  }

  if (preview.hex) {
    return {
      detail: preview.hex,
      label: 'Hash',
      status: 'Ready',
      tone: 'ready',
    };
  }

  return {
    detail: 'Building preview.',
    label: 'Hash',
    status: 'Building',
    tone: 'muted',
  };
}

function formatCount(count: number, label: string): string {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}
