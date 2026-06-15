import { describe, expect, test } from 'bun:test';
import { getHashPresentation } from '../src/builder/reviewStepPresentation';

describe('review step presentation', () => {
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
