import { describe, expect, test } from 'bun:test';
import { createCancellableRequestTracker } from '../src/builder/cancellableAsync';

describe('createCancellableRequestTracker', () => {
  test('ignores stale async results after cancel', () => {
    const tracker = createCancellableRequestTracker();
    const first = tracker.begin();
    tracker.cancel();
    expect(tracker.isCurrent(first)).toBe(false);
  });

  test('tracks the latest request id', () => {
    const tracker = createCancellableRequestTracker();
    const first = tracker.begin();
    const second = tracker.begin();
    expect(tracker.isCurrent(first)).toBe(false);
    expect(tracker.isCurrent(second)).toBe(true);
  });
});
