import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from './errors';
import type { RegistrationDraftMetadataHashPreview } from './reviewStepPresentation';
import type { RegistrationDraftFields } from './registrationDraftFields';
import {
  createRegistrationDraftReview,
  createRegistrationMetadataHashHex,
  type RegistrationDraftReview,
} from './registrationDraftReview';

export function useRegistrationDraftReview(fields: RegistrationDraftFields): {
  metadataHashPreview: RegistrationDraftMetadataHashPreview;
  review: RegistrationDraftReview;
} {
  const review = useMemo(
    () => createRegistrationDraftReview(fields),
    [fields],
  );
  const [metadataHashPreview, setMetadataHashPreview] =
    useState<RegistrationDraftMetadataHashPreview>({
      error: null,
      hex: null,
      pending: false,
    });

  useEffect(() => {
    let canceled = false;

    async function createHashPreview() {
      setMetadataHashPreview({
        error: null,
        hex: null,
        pending: true,
      });
      try {
        const hashHex = await createRegistrationMetadataHashHex(
          review.metadata,
        );
        if (!canceled) {
          setMetadataHashPreview({
            error: null,
            hex: hashHex,
            pending: false,
          });
        }
      } catch (caughtError) {
        if (!canceled) {
          setMetadataHashPreview({
            error: getErrorMessage(
              caughtError,
              'Could not build metadata hash.',
            ),
            hex: null,
            pending: false,
          });
        }
      }
    }

    void createHashPreview();

    return () => {
      canceled = true;
    };
  }, [review.metadata]);

  return {
    metadataHashPreview,
    review,
  };
}
