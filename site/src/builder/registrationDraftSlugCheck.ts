import type { RegistrySlugLookupResult } from '@/chain/slugLookup';

export type RegistrationDraftSlugCheckState =
  | {
      status: 'idle';
      message: string;
    }
  | {
      status: 'checking';
      message: string;
    }
  | {
      status: 'available';
      checkedSlug: string;
      message: string;
    }
  | {
      status: 'taken';
      checkedSlug: string;
      owner: string;
      message: string;
    }
  | {
      status: 'unconfigured';
      message: string;
    }
  | {
      status: 'error';
      message: string;
    };

export type SlugCheckStatus = RegistrationDraftSlugCheckState['status'];

export type ReviewTone = 'ready' | 'warning' | 'error' | 'muted';

export type SlugCheckPresentation = {
  button: string;
  detail: string;
  status: string;
  tone: ReviewTone;
};

const SLUG_CHECK_MESSAGES = {
  idle: 'Not checked.',
  checking: 'Checking registry…',
  available: 'Slug is available.',
  taken: 'Slug taken — change it on Basics and re-check.',
  unconfigured: 'Registry not configured — slug check skipped for local dev.',
  missingSlug: 'Add a slug first.',
  lookupFailed: 'Could not check slug.',
} as const;

export const INITIAL_REGISTRATION_DRAFT_SLUG_CHECK: RegistrationDraftSlugCheckState =
  {
    status: 'idle',
    message: SLUG_CHECK_MESSAGES.idle,
  };

const SLUG_CHECK_PRESENTATION = {
  idle: {
    button: 'Check slug',
    detail: 'Waiting to check.',
    status: 'Not checked',
    tone: 'muted',
  },
  checking: {
    button: 'Checking…',
    detail: SLUG_CHECK_MESSAGES.checking,
    status: 'Checking',
    tone: 'muted',
  },
  available: {
    button: 'Re-check slug',
    status: 'Available',
    tone: 'ready',
  },
  taken: {
    button: 'Re-check slug',
    status: 'Taken',
    tone: 'warning',
  },
  unconfigured: {
    button: 'Check slug',
    detail: 'Skipped in local dev.',
    status: 'Skipped',
    tone: 'muted',
  },
  error: {
    button: 'Re-check slug',
    status: 'Error',
    tone: 'error',
  },
} satisfies Record<
  SlugCheckStatus,
  {
    button: string;
    detail?: string;
    status: string;
    tone: ReviewTone;
  }
>;

const REVIEW_SLUG_BLOCKER_MESSAGE = {
  idle: 'Waiting for slug availability check.',
  checking: 'Waiting for slug availability check.',
  taken: SLUG_CHECK_MESSAGES.taken,
} satisfies Record<
  Exclude<SlugCheckStatus, 'available' | 'unconfigured' | 'error'>,
  string
>;

export function isReviewSlugCheckReady(
  slugCheck: RegistrationDraftSlugCheckState,
): boolean {
  return (
    slugCheck.status === 'available' || slugCheck.status === 'unconfigured'
  );
}

export function getReviewSlugBlockerMessage(
  slugCheck: RegistrationDraftSlugCheckState,
): string | null {
  switch (slugCheck.status) {
    case 'idle':
    case 'checking':
    case 'taken':
      return REVIEW_SLUG_BLOCKER_MESSAGE[slugCheck.status];
    case 'error':
      return slugCheck.message;
    case 'available':
    case 'unconfigured':
      return null;
    default:
      return assertNever(slugCheck);
  }
}

export function getSlugCheckPresentation(
  slugCheck: RegistrationDraftSlugCheckState,
): SlugCheckPresentation {
  const presentation = SLUG_CHECK_PRESENTATION[slugCheck.status];

  return {
    button: presentation.button,
    detail: getSlugCheckDetail(slugCheck, 'detail' in presentation ? presentation.detail : undefined),
    status: presentation.status,
    tone: presentation.tone,
  };
}

export function createSlugCheckCheckingState(): RegistrationDraftSlugCheckState {
  return {
    status: 'checking',
    message: SLUG_CHECK_MESSAGES.checking,
  };
}

export function createSlugCheckErrorState(
  message: string,
): RegistrationDraftSlugCheckState {
  return {
    status: 'error',
    message,
  };
}

export function createSlugCheckFromLookupResult(
  normalizedSlug: string,
  result: RegistrySlugLookupResult,
): RegistrationDraftSlugCheckState {
  switch (result.status) {
    case 'available':
      return {
        status: 'available',
        checkedSlug: normalizedSlug,
        message: SLUG_CHECK_MESSAGES.available,
      };
    case 'taken':
      return {
        status: 'taken',
        checkedSlug: normalizedSlug,
        owner: result.listing.owner,
        message: SLUG_CHECK_MESSAGES.taken,
      };
    case 'unconfigured':
      return {
        status: 'unconfigured',
        message: SLUG_CHECK_MESSAGES.unconfigured,
      };
    case 'error':
      return {
        status: 'error',
        message: result.message,
      };
    default:
      return assertNever(result);
  }
}

export function getMissingSlugCheckErrorMessage(): string {
  return SLUG_CHECK_MESSAGES.missingSlug;
}

export function getSlugLookupFailureMessage(): string {
  return SLUG_CHECK_MESSAGES.lookupFailed;
}

function getSlugCheckDetail(
  slugCheck: RegistrationDraftSlugCheckState,
  detailOverride?: string,
): string {
  if (detailOverride) return detailOverride;

  switch (slugCheck.status) {
    case 'available':
      return slugCheck.checkedSlug;
    case 'taken':
      return `Registered to ${slugCheck.owner}.`;
    case 'error':
    case 'idle':
    case 'checking':
    case 'unconfigured':
      return slugCheck.message;
    default:
      return assertNever(slugCheck);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled slug check state: ${String(value)}`);
}
