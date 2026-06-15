import { useCallback, useEffect, useRef, useState } from 'react';
import { lookupRegistrySlug } from '@/chain/slugLookup';
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    requestIdRef.current += 1;
    setSlugCheck(INITIAL_REGISTRATION_DRAFT_SLUG_CHECK);
  }, [slug]);

  const onCheckSlug = useCallback(async () => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      setSlugCheck(createSlugCheckErrorState(getMissingSlugCheckErrorMessage()));
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSlugCheck(createSlugCheckCheckingState());

    let result: Awaited<ReturnType<typeof lookupRegistrySlug>>;
    try {
      result = await lookupRegistrySlug(normalizedSlug);
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) return;
      setSlugCheck(
        createSlugCheckErrorState(
          getErrorMessage(caughtError, getSlugLookupFailureMessage()),
        ),
      );
      return;
    }

    if (requestId !== requestIdRef.current) return;

    setSlugCheck(createSlugCheckFromLookupResult(normalizedSlug, result));
  }, [slug]);

  return {
    onCheckSlug,
    slugCheck,
  };
}
