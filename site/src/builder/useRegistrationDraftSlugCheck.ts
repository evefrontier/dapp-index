import { useCallback, useEffect, useState } from 'react';
import { lookupRegistrySlug } from '@/chain/slugLookup';
import { normalizeRegistrySlug } from '@/chain/normalizeRegistrySlug';
import { useCancellableAsync } from './cancellableAsync';
import { getErrorMessage } from './errors';
import {
  createSlugCheckCheckingState,
  createSlugCheckErrorState,
  createSlugCheckFromLookupResult,
  getMissingSlugCheckErrorMessage,
  getSlugLookupFailureMessage,
  INITIAL_REGISTRATION_DRAFT_SLUG_CHECK,
  type RegistrationDraftSlugCheckState,
} from './registrationDraftSlugCheck';

export function useRegistrationDraftSlugCheck(slug: string): {
  onCheckSlug: () => Promise<void>;
  slugCheck: RegistrationDraftSlugCheckState;
} {
  const [slugCheck, setSlugCheck] =
    useState<RegistrationDraftSlugCheckState>(
      INITIAL_REGISTRATION_DRAFT_SLUG_CHECK,
    );
  const asyncTracker = useCancellableAsync();

  useEffect(() => {
    asyncTracker.cancel();
    setSlugCheck(INITIAL_REGISTRATION_DRAFT_SLUG_CHECK);
  }, [asyncTracker, slug]);

  const onCheckSlug = useCallback(async () => {
    const normalizedSlug = normalizeRegistrySlug(slug);
    if (!normalizedSlug) {
      setSlugCheck(createSlugCheckErrorState(getMissingSlugCheckErrorMessage()));
      return;
    }

    const requestId = asyncTracker.begin();
    setSlugCheck(createSlugCheckCheckingState());

    let result: Awaited<ReturnType<typeof lookupRegistrySlug>>;
    try {
      result = await lookupRegistrySlug(normalizedSlug);
    } catch (caughtError) {
      if (!asyncTracker.isCurrent(requestId)) return;
      setSlugCheck(
        createSlugCheckErrorState(
          getErrorMessage(caughtError, getSlugLookupFailureMessage()),
        ),
      );
      return;
    }

    if (!asyncTracker.isCurrent(requestId)) return;

    setSlugCheck(createSlugCheckFromLookupResult(normalizedSlug, result));
  }, [asyncTracker, slug]);

  return {
    onCheckSlug,
    slugCheck,
  };
}
