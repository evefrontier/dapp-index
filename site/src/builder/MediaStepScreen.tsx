import { Button } from '@evefrontier/ui';
import { useRef, useState } from 'react';
import type {
  DraftMedia,
  DraftMediaUpdate,
} from '@/storage/draftStorage';
import { REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH } from '@/schemas/registration-draft-media';
import { BuilderBracketFrame, type BuilderBracketTone } from './BuilderBracketFrame';
import { FieldError, TextField } from './FormFields';
import { MediaPreviewModal } from './MediaPreviewModal';
import { MediaGuideBulletList } from './MediaGuideBulletList';
import { getMediaSlotFormatBullets } from './mediaRoleModel';
import {
  getAcceptAttributeForSlot,
  getCategoryNavLabel,
  getCategoryNavStatus,
  getDefaultGalleryIndex,
  getMediaForSlot,
  getMediaSlotDefinition,
  getMediaSlotNavLabel,
  getMediaSlotStatus,
  MEDIA_CATEGORY_NAV_IDS,
  MEDIA_GALLERY_NAV_SLOT_IDS,
  resolveSlotFromCategory,
  type MediaCategoryNavId,
  type MediaSlotDefinition,
  type MediaSlotId,
  type MediaSlotStatus,
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

type MediaNavSelection = {
  categoryId: MediaCategoryNavId;
  galleryIndex: number;
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
  const [selection, setSelection] = useState<MediaNavSelection>({
    categoryId: 'logo',
    galleryIndex: 0,
  });
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const selectedSlotId = resolveSlotFromCategory(
    selection.categoryId,
    selection.galleryIndex,
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
        <MediaCategoryNav
          media={media}
          pending={pending}
          selectedCategoryId={selection.categoryId}
          selectedSlotId={selectedSlotId}
          onSelectCategory={(categoryId) => {
            setSelection({
              categoryId,
              galleryIndex:
                categoryId === 'gallery' ? getDefaultGalleryIndex(media) : 0,
            });
          }}
          onSelectGalleryIndex={(galleryIndex) => {
            setSelection({ categoryId: 'gallery', galleryIndex });
          }}
        />

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

function MediaCategoryNav({
  media,
  pending,
  selectedCategoryId,
  selectedSlotId,
  onSelectCategory,
  onSelectGalleryIndex,
}: {
  media: DraftMedia[];
  pending: boolean;
  selectedCategoryId: MediaCategoryNavId;
  selectedSlotId: MediaSlotId;
  onSelectCategory: (categoryId: MediaCategoryNavId) => void;
  onSelectGalleryIndex: (galleryIndex: number) => void;
}) {
  return (
    <div className="builder-media-category-nav">
      <nav aria-label="Media categories">
        <ol className="builder-media-slot-nav builder-media-slot-nav--primary">
          {MEDIA_CATEGORY_NAV_IDS.map((categoryId) => (
            <MediaCategoryBracketNavItem
              key={categoryId}
              categoryId={categoryId}
              media={media}
              pending={pending}
              selected={categoryId === selectedCategoryId}
              onSelect={onSelectCategory}
            />
          ))}
        </ol>
      </nav>

      {selectedCategoryId === 'gallery' ? (
        <nav aria-label="Gallery images">
          <ol className="builder-media-slot-nav builder-media-slot-nav--gallery">
            {MEDIA_GALLERY_NAV_SLOT_IDS.map((slotId, index) => (
              <MediaTextNavItem
                key={slotId}
                media={media}
                pending={pending}
                selected={slotId === selectedSlotId}
                slotId={slotId}
                onSelect={() => onSelectGalleryIndex(index)}
              />
            ))}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}

function MediaCategoryBracketNavItem({
  categoryId,
  media,
  pending,
  selected,
  onSelect,
}: {
  categoryId: MediaCategoryNavId;
  media: DraftMedia[];
  pending: boolean;
  selected: boolean;
  onSelect: (categoryId: MediaCategoryNavId) => void;
}) {
  const status = getCategoryNavStatus(media, categoryId);
  const label = getCategoryNavLabel(categoryId);

  return (
    <li className="builder-media-slot-nav-item">
      <button
        type="button"
        aria-current={selected ? 'step' : undefined}
        className="builder-media-slot-step group block w-full"
        data-selected={selected ? 'true' : undefined}
        data-status={status}
        disabled={pending}
        onClick={() => onSelect(categoryId)}
      >
        <BuilderBracketFrame
          tone={getSlotNavBracketTone(status, selected, pending)}
        >
          <span className="builder-media-slot-step-content">{label}</span>
        </BuilderBracketFrame>
      </button>
    </li>
  );
}

function MediaTextNavItem({
  media,
  pending,
  selected,
  slotId,
  onSelect,
}: {
  media: DraftMedia[];
  pending: boolean;
  selected: boolean;
  slotId: MediaSlotId;
  onSelect: () => void;
}) {
  const status = getMediaSlotStatus(media, slotId);
  const label = getMediaSlotNavLabel(slotId);

  return (
    <li className="builder-media-slot-nav-item">
      <button
        type="button"
        aria-current={selected ? 'step' : undefined}
        className="builder-media-gallery-filter"
        data-selected={selected ? 'true' : undefined}
        data-status={status}
        disabled={pending}
        onClick={onSelect}
      >
        {label}
      </button>
    </li>
  );
}

function getSlotNavBracketTone(
  status: MediaSlotStatus,
  selected: boolean,
  pending: boolean,
): BuilderBracketTone {
  if (pending) return 'disabled';
  if (status === 'required-missing') return 'error';
  if (selected) return 'active';
  return 'default';
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
  const formatBullets = getMediaSlotFormatBullets(slot);
  const slotNavLabel = getMediaSlotNavLabel(slot.id);

  return (
    <section className="builder-media-slot-panel">
      <div className="space-y-2">
        <p className="text-sm text-(--color-neutral-60)">{slot.purpose}</p>
        <MediaGuideBulletList items={formatBullets} />
      </div>

      <div className="builder-media-slot-body">
        <div className="builder-media-slot-preview-column">
          <MediaSlotPreview
            errors={errors}
            media={media}
            previewUrl={previewUrl}
            slotLabel={slotNavLabel}
            onOpenPreview={onOpenPreview}
          />
          <Button
            disabled={pending}
            size="small"
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            {media ? 'Replace' : 'Upload'}
          </Button>
        </div>

        {media ? (
          <div className="min-w-0 grid gap-3">
            <TextField
              error={errors?.alt}
              id={`builder-media-${media.id}-alt`}
              label="Alt text"
              maxLength={REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH}
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
                maxLength={REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH}
                value={media.caption ?? ''}
                onChange={(caption) => {
                  void onUpdateMedia(media.id, { caption });
                }}
              />
            ) : null}
            {!slot.required ? (
              <button
                type="button"
                className="builder-text-button-danger justify-self-start"
                disabled={pending}
                onClick={() => {
                  void onDeleteMedia(media.id);
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

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

function MediaSlotPreview({
  errors,
  media,
  onOpenPreview,
  previewUrl,
  slotLabel,
}: {
  errors: RegistrationDraftMediaFieldErrors;
  media: DraftMedia | null;
  onOpenPreview: (mediaId: string) => void;
  previewUrl: string | null;
  slotLabel: string;
}) {
  const tone = media ? getPreviewTone(errors) : 'default';

  return (
    <BuilderBracketFrame tone={tone}>
      <div className="builder-media-preview-shell">
        {media && previewUrl ? (
          <button
            type="button"
            aria-label={`Open preview for ${media.name}`}
            className="builder-media-preview"
            onClick={() => onOpenPreview(media.id)}
          >
            {media.kind === 'video' ? (
              <video
                className="builder-media-preview-media"
                muted
                playsInline
                preload="metadata"
                src={previewUrl}
              />
            ) : (
              <img
                alt={media.alt || media.name}
                className="builder-media-preview-media"
                src={previewUrl}
              />
            )}
            <MediaIdentity media={media} />
          </button>
        ) : (
          <div className="builder-media-preview-placeholder">
            <p>
              {media
                ? 'Preview unavailable'
                : `No ${slotLabel.toLowerCase()} yet`}
            </p>
          </div>
        )}
      </div>
    </BuilderBracketFrame>
  );
}

function getPreviewTone(
  errors: RegistrationDraftMediaFieldErrors,
): BuilderBracketTone {
  if (errors?.alt || errors?.caption) return 'error';
  return 'default';
}

function MediaIdentity({ media }: { media: DraftMedia }) {
  return (
    <div className="absolute inset-x-0 bottom-0 min-w-0 bg-black/80 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="min-w-0 flex-1 truncate text-xs">{media.name}</h4>
        <span className="builder-status-badge">
          {media.kind === 'video' ? 'Video' : 'Image'}
        </span>
      </div>
    </div>
  );
}
