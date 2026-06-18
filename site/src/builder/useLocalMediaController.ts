import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Draft, DraftMediaUpdate, DraftStorage } from '@/storage/draftStorage';
import { getErrorMessage } from './errors';
import { getMediaForSlot, type MediaSlotId } from './mediaSlotModel';
import {
  replaceRegistrationDraftMediaForSlot,
  validateRegistrationDraftMediaUploadForSlot,
} from './registrationDraftMedia';

export function useLocalMediaController({
  draftMedia,
  loadedDraftId,
  setDraft,
  storage,
}: {
  draftMedia: Draft['media'];
  loadedDraftId: string | null;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  storage: DraftStorage;
}) {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaPending, setMediaPending] = useState(false);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setMediaError(null);
  }, [loadedDraftId]);

  useEffect(() => {
    let canceled = false;
    const objectUrls: string[] = [];

    async function loadMediaPreviews() {
      if (!loadedDraftId || draftMedia.length === 0) {
        setMediaPreviewUrls((currentUrls) => {
          revokeObjectUrls(currentUrls);
          return {};
        });
        return;
      }

      try {
        const previewEntries = await Promise.all(
          draftMedia.map(async (media) => {
            const content = await storage.getLocalMedia(loadedDraftId, media.id);
            if (!content) return null;

            const url = URL.createObjectURL(content);
            objectUrls.push(url);
            return [media.id, url] as const;
          }),
        );

        if (canceled) {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        setMediaPreviewUrls((currentUrls) => {
          revokeObjectUrls(currentUrls);
          return Object.fromEntries(previewEntries.filter(isPreviewEntry));
        });
      } catch (caughtError) {
        if (!canceled) {
          setMediaError(
            getErrorMessage(
              caughtError,
              'Could not load local media previews.',
            ),
          );
        }
      }
    }

    void loadMediaPreviews();

    return () => {
      canceled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [draftMedia, loadedDraftId, storage]);

  const refreshLoadedDraft = useCallback(async () => {
    if (!loadedDraftId) return;

    const refreshedDraft = await storage.getDraft(loadedDraftId);
    setDraft(refreshedDraft);
  }, [loadedDraftId, setDraft, storage]);

  const onUploadMediaForSlot = useCallback(
    async (slotId: MediaSlotId, file: File) => {
      if (!loadedDraftId || mediaPending) return;

      const existingItem = getMediaForSlot(draftMedia, slotId);
      const limitsValidation = validateRegistrationDraftMediaUploadForSlot(
        slotId,
        draftMedia,
        file,
        { replacing: Boolean(existingItem) },
      );
      if (!limitsValidation.ok) {
        setMediaError(limitsValidation.errorMessage);
        return;
      }

      setMediaPending(true);
      setMediaError(null);
      try {
        await replaceRegistrationDraftMediaForSlot(
          storage,
          loadedDraftId,
          slotId,
          file,
          limitsValidation.mimeType,
        );
        await refreshLoadedDraft();
      } catch (caughtError) {
        setMediaError(
          getErrorMessage(caughtError, 'Could not save local media.'),
        );
        try {
          await refreshLoadedDraft();
        } catch {
          // Keep the original media error visible.
        }
      } finally {
        setMediaPending(false);
      }
    },
    [
      draftMedia,
      loadedDraftId,
      mediaPending,
      refreshLoadedDraft,
      storage,
    ],
  );

  const onUpdateMedia = useCallback(
    async (mediaId: string, update: DraftMediaUpdate) => {
      if (!loadedDraftId) return;

      setMediaError(null);
      try {
        const updatedDraft = await storage.updateMedia(
          loadedDraftId,
          mediaId,
          update,
        );
        setDraft(updatedDraft);
      } catch (caughtError) {
        setMediaError(
          getErrorMessage(caughtError, 'Could not update media.'),
        );
      }
    },
    [loadedDraftId, setDraft, storage],
  );

  const onDeleteMedia = useCallback(
    async (mediaId: string) => {
      if (!loadedDraftId || mediaPending) return;

      setMediaPending(true);
      setMediaError(null);
      try {
        const updatedDraft = await storage.deleteMedia(loadedDraftId, mediaId);
        setDraft(updatedDraft);
      } catch (caughtError) {
        setMediaError(
          getErrorMessage(caughtError, 'Could not remove media.'),
        );
      } finally {
        setMediaPending(false);
      }
    },
    [loadedDraftId, mediaPending, setDraft, storage],
  );

  return {
    mediaError,
    mediaPending,
    mediaPreviewUrls,
    onDeleteMedia,
    onUpdateMedia,
    onUploadMediaForSlot,
  };
}

function revokeObjectUrls(urls: Record<string, string>): void {
  Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
}

function isPreviewEntry(
  value: readonly [string, string] | null,
): value is readonly [string, string] {
  return value !== null;
}
