import { useRef } from 'react';

export type CancellableRequestTracker = {
  begin: () => number;
  isCurrent: (requestId: number) => boolean;
  cancel: () => void;
};

export function createCancellableRequestTracker(): CancellableRequestTracker {
  let currentId = 0;

  return {
    begin() {
      currentId += 1;
      return currentId;
    },
    isCurrent(requestId) {
      return requestId === currentId;
    },
    cancel() {
      currentId += 1;
    },
  };
}

export function useCancellableAsync(): CancellableRequestTracker {
  const trackerRef = useRef<CancellableRequestTracker | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = createCancellableRequestTracker();
  }
  return trackerRef.current;
}
