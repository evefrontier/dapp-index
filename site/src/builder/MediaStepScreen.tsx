import { Button } from '@evefrontier/component-library';
import { useRef, useState } from 'react';
import type {
  DraftMedia,
  DraftMediaUpdate,
} from '@/storage/draftStorage';
import { FieldError, TextField } from './FormFields';
import { MediaPreviewModal } from './MediaPreviewModal';
import { MEDIA_STEP_GUIDANCE } from './mediaRoleModel';
import {
  getAcceptAttributeForSlot,
  getMediaForSlot,
  getMediaSlotDefinition,
  getMediaSlotStatus,
  MEDIA_SLOT_IDS,
  type MediaSlotDefinition,
  type MediaSlotId,
} from './mediaSlotModel';
import type {
  RegistrationDraftMediaErrors,
  RegistrationDraftMediaFieldErrors,
} from './registrationDraftMedia';

export type MediaStepScreenProps = {
  errorMessage: string | null;
  media: DraftMedia[];
  mediaErrors: RegistrationDraftMediaErrors;
  pending: boolean;
  previewUrls: Record<string, string>;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUploadMediaForSlot: (
    slotId: MediaSlotId,
    file: File,
  ) => Promise<void>;
};

export function MediaStepScreen({
  errorMessage,
  media,
  mediaErrors,
  pending,
  previewUrls,
  onDeleteMedia,
  onUpdateMedia,
  onUploadMediaForSlot,
}: MediaStepScreenProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<MediaSlotId>('logo');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const selectedSlot = getMediaSlotDefinition(selectedSlotId);
  const slotMedia = getMediaForSlot(media, selectedSlotId);
  const selectedPreview = media.find((item) => item.id === selectedPreviewId);
  const selectedPreviewUrl = selectedPreview
    ? previewUrls[selectedPreview.id] ?? null
    : null;

  return (
    <div className="builder-media-slots">
      <FieldError id="builder-media-upload" message={errorMessage ?? undefined} />

      <div className="builder-media-slots-layout">
        <nav aria-label="Media slots">
          <ol className="builder-media-slot-nav">
            {MEDIA_SLOT_IDS.map((slotId) => (
              <li key={slotId}>
                <button
                  type="button"
                  aria-current={slotId === selectedSlotId ? 'step' : undefined}
                  className="builder-media-slot-button"
                  data-selected={slotId === selectedSlotId ? 'true' : undefined}
                  data-status={getMediaSlotStatus(media, slotId)}
                  disabled={pending}
                  onClick={() => setSelectedSlotId(slotId)}
                >
                  <span className="builder-media-slot-button-label">
                    {getMediaSlotDefinition(slotId).navLabel}
                  </span>
                  <MediaSlotStatusLabel slotId={slotId} media={media} />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <MediaSlotPanel
          errors={slotMedia ? mediaErrors[slotMedia.id] ?? {} : {}}
          media={slotMedia}
          pending={pending}
          previewUrl={slotMedia ? previewUrls[slotMedia.id] ?? null : null}
          slot={selectedSlot}
          onDeleteMedia={onDeleteMedia}
          onOpenPreview={setSelectedPreviewId}
          onUpdateMedia={onUpdateMedia}
          onUploadMediaForSlot={onUploadMediaForSlot}
        />
      </div>

      <MediaPreviewModal
        media={selectedPreview ?? null}
        previewUrl={selectedPreviewUrl}
        onClose={() => setSelectedPreviewId(null)}
      />
    </div>
  );
}

function MediaSlotStatusLabel({
  media,
  slotId,
}: {
  media: DraftMedia[];
  slotId: MediaSlotId;
}) {
  const status = getMediaSlotStatus(media, slotId);
  if (status === 'filled') {
    return (
      <span className="builder-media-slot-button-status">Added</span>
    );
  }
  if (status === 'required-missing') {
    return (
      <span className="builder-media-slot-button-status">Required</span>
    );
  }
  return null;
}

function MediaSlotPanel({
  errors,
  media,
  pending,
  previewUrl,
  slot,
  onDeleteMedia,
  onOpenPreview,
  onUpdateMedia,
  onUploadMediaForSlot,
}: {
  errors: RegistrationDraftMediaFieldErrors;
  media: DraftMedia | null;
  pending: boolean;
  previewUrl: string | null;
  slot: MediaSlotDefinition;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onOpenPreview: (mediaId: string) => void;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUploadMediaForSlot: (
    slotId: MediaSlotId,
    file: File,
  ) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const accept = getAcceptAttributeForSlot(slot.id);
  const showCaption = slot.role === 'gallery' || slot.kind === 'video';

  return (
    <section className="builder-media-slot-panel">
      <div className="space-y-2">
        <h3>{slot.label}</h3>
        <p className="text-sm text-(--colors-neutral-60)">{slot.purpose}</p>
      </div>

      <div className="builder-media-slot-guide">
        <p>{slot.guide}</p>
        <p>
          {slot.kind === 'video'
            ? `WebM up to ${MEDIA_STEP_GUIDANCE.videoLimit}.`
            : `PNG, JPEG, or WebP up to ${MEDIA_STEP_GUIDANCE.imageLimit}.`}
        </p>
      </div>

      {media ? (
        <div className="grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)]">
          <MediaPreviewButton
            media={media}
            previewUrl={previewUrl}
            onOpenPreview={onOpenPreview}
          />
          <div className="min-w-0 grid gap-3">
            <TextField
              error={errors?.alt}
              id={`builder-media-${media.id}-alt`}
              label="Alt text"
              maxLength={240}
              value={media.alt ?? ''}
              onChange={(alt) => {
                void onUpdateMedia(media.id, { alt });
              }}
            />
            {showCaption ? (
              <TextField
                error={errors?.caption}
                id={`builder-media-${media.id}-caption`}
                label="Caption"
                maxLength={240}
                value={media.caption ?? ''}
                onChange={(caption) => {
                  void onUpdateMedia(media.id, { caption });
                }}
              />
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={pending}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              {!slot.required ? (
                <button
                  type="button"
                  className="builder-text-button-danger"
                  disabled={pending}
                  onClick={() => {
                    void onDeleteMedia(media.id);
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="builder-media-slot-empty">
          <p className="text-sm text-(--colors-neutral-60)">
            No {slot.label.toLowerCase()} added yet.
          </p>
          <Button
            disabled={pending}
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        accept={accept}
        className="sr-only"
        disabled={pending}
        type="file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void onUploadMediaForSlot(slot.id, file);
        }}
      />
    </section>
  );
}

function MediaPreviewButton({
  media,
  onOpenPreview,
  previewUrl,
}: {
  media: DraftMedia;
  onOpenPreview: (mediaId: string) => void;
  previewUrl: string | null;
}) {
  return (
    <button
      type="button"
      aria-label={`Open preview for ${media.name}`}
      className="builder-media-preview"
      disabled={!previewUrl}
      onClick={() => onOpenPreview(media.id)}
    >
      {previewUrl ? (
        media.kind === 'video' ? (
          <video
            className="h-full w-full object-contain"
            muted
            playsInline
            preload="metadata"
            src={previewUrl}
          />
        ) : (
          <img
            alt={media.alt || media.name}
            className="h-full w-full object-contain"
            src={previewUrl}
          />
        )
      ) : (
        <p className="text-xs text-(--colors-neutral-60)">Preview unavailable</p>
      )}
      <MediaIdentity media={media} />
    </button>
  );
}

function MediaIdentity({ media }: { media: DraftMedia }) {
  return (
    <div className="absolute inset-x-0 bottom-0 min-w-0 space-y-1 bg-black/80 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="min-w-0 flex-1 truncate text-xs">{media.name}</h4>
        <span className="builder-status-badge">
          {media.kind === 'video' ? 'Video' : 'Image'}
        </span>
      </div>
      <p className="truncate text-xs text-(--colors-neutral-60)">{media.id}</p>
    </div>
  );
}
