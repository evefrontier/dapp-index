import { Button } from '@evefrontier/ui';
import { useRef, useState } from 'react';
import type {
  DraftMedia,
  DraftMediaUpdate,
} from '@/storage/draftStorage';
import type { DappIndexMediaRole } from '@/types/dapp-index';
import { FieldError, TextField, getFieldErrorId } from './FormFields';
import { MediaPreviewModal } from './MediaPreviewModal';
import {
  MEDIA_STEP_GUIDANCE,
  getMediaRoleOption,
  getMediaRoleOptionsForKind,
} from './mediaRoleModel';
import type {
  RegistrationDraftMediaErrors,
  RegistrationDraftMediaFieldErrors,
} from './registrationDraftMedia';

const ACCEPTED_MEDIA_TYPES = 'image/png,image/jpeg,image/webp,video/webm';

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
};

export function MediaStepScreen({
  errorMessage,
  media,
  mediaErrors,
  pending,
  previewUrls,
  onDeleteMedia,
  onUpdateMedia,
}: MediaStepScreenProps) {
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const selectedPreview = media.find((item) => item.id === selectedPreviewId);
  const selectedPreviewUrl = selectedPreview
    ? previewUrls[selectedPreview.id] ?? null
    : null;

  return (
    <div className="grid gap-4">
      <MediaStepGuidance media={media} />
      <FieldError id="builder-media-upload" message={errorMessage ?? undefined} />

      {media.length === 0 ? (
        <EmptyMediaList />
      ) : (
        <div className="grid gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              errors={mediaErrors[item.id] ?? {}}
              media={item}
              pending={pending}
              previewUrl={previewUrls[item.id] ?? null}
              onDeleteMedia={onDeleteMedia}
              onOpenPreview={setSelectedPreviewId}
              onUpdateMedia={onUpdateMedia}
            />
          ))}
        </div>
      )}

      <MediaPreviewModal
        media={selectedPreview ?? null}
        previewUrl={selectedPreviewUrl}
        onClose={() => setSelectedPreviewId(null)}
      />
    </div>
  );
}

export function MediaUploadAction({
  disabled,
  onUploadMedia,
}: {
  disabled: boolean;
  onUploadMedia: (files: File[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={inputRef}
        accept={ACCEPTED_MEDIA_TYPES}
        className="sr-only"
        disabled={disabled}
        multiple
        type="file"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = '';
          if (files.length > 0) void onUploadMedia(files);
        }}
      />
      <Button
        disabled={disabled}
        size="small"
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
      >
        Add media
      </Button>
    </>
  );
}

function MediaStepGuidance({ media }: { media: DraftMedia[] }) {
  const videoCount = media.filter((item) => item.kind === 'video').length;

  return (
    <div className="grid gap-2 border border-(--color-neutral-20) p-4 text-xs text-(--color-neutral-60)">
      <h4>Listing media</h4>
      <ul className="grid list-disc gap-1 pl-4">
        <li>
          PNG, JPEG, or WebP up to {MEDIA_STEP_GUIDANCE.imageLimit}; WebM up
          to {MEDIA_STEP_GUIDANCE.videoLimit}
        </li>
        <li>
          Up to {MEDIA_STEP_GUIDANCE.itemLimit} items ({media.length}/
          {MEDIA_STEP_GUIDANCE.itemLimit}) and{' '}
          {MEDIA_STEP_GUIDANCE.videoLimitCount} videos ({videoCount}/
          {MEDIA_STEP_GUIDANCE.videoLimitCount})
        </li>
        <li>
          {MEDIA_STEP_GUIDANCE.totalLimit} total across images, posters, and
          video sources
        </li>
        <li>Stored locally in your browser until publish</li>
      </ul>
    </div>
  );
}

function MediaCard({
  errors,
  media,
  pending,
  previewUrl,
  onDeleteMedia,
  onOpenPreview,
  onUpdateMedia,
}: {
  errors: RegistrationDraftMediaFieldErrors;
  media: DraftMedia;
  pending: boolean;
  previewUrl: string | null;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onOpenPreview: (mediaId: string) => void;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
}) {
  return (
    <section className="grid gap-3 border-t border-(--color-neutral-20) py-3 first:border-t-0 first:pt-0 md:grid-cols-[13rem_minmax(0,1fr)]">
      <MediaPreviewButton
        media={media}
        previewUrl={previewUrl}
        onOpenPreview={onOpenPreview}
      />

      <div className="min-w-0 grid gap-3">
        <MediaRoleFilter
          error={errors?.role}
          id={`builder-media-${media.id}-role`}
          kind={media.kind}
          value={media.role}
          onChange={(role) => {
            void onUpdateMedia(media.id, { role });
          }}
        />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
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
          <button
            type="button"
            className="builder-text-button-danger self-start justify-self-start pt-1"
            disabled={pending}
            onClick={() => {
              void onDeleteMedia(media.id);
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </section>
  );
}

function MediaRoleFilter({
  error,
  id,
  kind,
  value,
  onChange,
}: {
  error?: string;
  id: string;
  kind: DraftMedia['kind'];
  value: DappIndexMediaRole;
  onChange: (role: DappIndexMediaRole) => void;
}) {
  const fieldId = id;
  const errorId = getFieldErrorId(fieldId, error);
  const options = getMediaRoleOptionsForKind(kind);
  const selectedOption = getMediaRoleOption(value);

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="builder-fieldset grid gap-2"
    >
      <legend>Role</legend>
      <div className="builder-role-filter">
        {options.map((option) => {
          const selected = value === option.role;

          return (
            <Button
              key={option.role}
              size="small"
              type="button"
              variant={selected ? 'primary' : 'secondary'}
              onClick={() => onChange(option.role)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      {selectedOption ? (
        <p className="text-xs text-(--color-neutral-60)">
          {selectedOption.description}
        </p>
      ) : null}
      <FieldError id={fieldId} message={error} />
    </fieldset>
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
      className="relative flex aspect-video h-32 w-full items-center justify-center overflow-hidden border border-(--color-neutral-20) bg-(--color-crude-60) text-left transition-colors hover:border-(--color-martian-red) disabled:cursor-default disabled:hover:border-(--color-neutral-20) md:h-32"
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
        <p className="text-xs text-(--color-neutral-60)">Preview unavailable</p>
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
      <p className="truncate text-xs text-(--color-neutral-60)">{media.id}</p>
    </div>
  );
}

function EmptyMediaList() {
  return (
    <div className="space-y-1 border border-(--color-neutral-20) p-4 text-sm text-(--color-neutral-60)">
      <p>No local media added.</p>
      <p className="text-xs text-(--color-neutral-60)">
        Add screenshots, a logo, or a WebM demo, then choose how each file is
        used on the listing.
      </p>
    </div>
  );
}
