import type { Draft } from '@/storage/draftStorage';

/**
 * A published draft is a local record of a completed publish. The builder does
 * not yet support editing a listing after publish, so these drafts are shown
 * read-only until the user deletes them.
 */
export function isPublishedDraft(draft: Draft): boolean {
  return draft.status === 'published';
}
