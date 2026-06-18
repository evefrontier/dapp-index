import { describe, expect, test } from 'bun:test';
import {
  getHashPresentation,
  getReviewStatusRows,
  getWarningIssues,
} from '../src/builder/reviewStepPresentation';
import { INITIAL_REGISTRATION_DRAFT_SLUG_CHECK } from '../src/builder/registrationDraftSlugCheck';
import type { RegistrationDraftReview } from '../src/builder/registrationDraftReview';

const baseReview: RegistrationDraftReview = {
  canonicalJson: '{}',
  issues: [
    {
      id: 'warning.one',
      label: 'Packages',
      message: 'Optional package note.',
      severity: 'warning',
    },
  ],
  metadata: {},
  ready: true,
  schemaValidation: { ok: true },
};

describe('review step presentation', () => {
  test('filters warning issues for the modal', () => {
    expect(getWarningIssues(baseReview)).toEqual([baseReview.issues[0]]);
  });

  test('builds review status rows from review, slug, and hash preview', () => {
    expect(
      getReviewStatusRows(baseReview, INITIAL_REGISTRATION_DRAFT_SLUG_CHECK, {
        error: null,
        hex: null,
        pending: true,
      }).readiness.status,
    ).toBe('Ready');
  });

  test('treats missing hash without error as building', () => {
    expect(getHashPresentation({ error: null, hex: null, pending: false })).toEqual({
      detail: 'Building preview.',
      label: 'Hash',
      status: 'Building',
      tone: 'muted',
    });
    expect(getHashPresentation({ error: null, hex: null, pending: true })).toEqual({
      detail: 'Building preview.',
      label: 'Hash',
      status: 'Building',
      tone: 'muted',
    });
  });

  test('shows hash errors as unavailable', () => {
    expect(
      getHashPresentation({
        error: 'Could not build metadata hash.',
        hex: null,
        pending: false,
      }),
    ).toEqual({
      detail: 'Could not build metadata hash.',
      label: 'Hash',
      status: 'Unavailable',
      tone: 'error',
    });
  });
});
