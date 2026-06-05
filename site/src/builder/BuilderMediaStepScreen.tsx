import { useEffect, useState } from 'react';
import type {
  DraftMedia,
  DraftMediaUpdate,
} from '@/storage/draftStorage';
import {
  DAPP_INDEX_MEDIA_ROLES,
  type DappIndexMediaRole,
} from '@/types/dapp-index';
import {
  BuilderSelectField,
  BuilderTextAreaField,
} from './BuilderFormFields';

const ACCEPTED_MEDIA_TYPES = 'image/png,image/jpeg,image/webp,video/webm';

export type BuilderMediaStepScreenProps = {
  errorMessage: string | null;
  media: DraftMedia[];
  pending: boolean;
  previewUrls: Record<string, string>;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUploadMedia: (files: File[]) => Promise<void>;
};

export function BuilderMediaStepScreen({
  errorMessage,
  media,
  pending,
  previewUrls,
  onDeleteMedia,
  onUpdateMedia,
  onUploadMedia,
}: BuilderMediaStepScreenProps) {
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const selectedPreview = media.find((item) => item.id === selectedPreviewId);
  const selectedPreviewUrl = selectedPreview
    ? previewUrls[selectedPreview.id] ?? null
    : null;

  return (
    <div className="grid gap-5">
      <MediaUploadBar
        disabled={pending}
        errorMessage={errorMessage}
        onUploadMedia={onUploadMedia}
      />

      {media.length === 0 ? (
        <EmptyMediaList />
      ) : (
        <div className="grid gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
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

function MediaUploadBar({
  disabled,
  errorMessage,
  onUploadMedia,
}: {
  disabled: boolean;
  errorMessage: string | null;
  onUploadMedia: (files: File[]) => Promise<void>;
}) {
  const labelClassName = disabled
    ? 'inline-flex cursor-not-allowed items-center border border-[var(--color-neutral-30)] px-3 py-2 text-xs font-bold uppercase text-[var(--color-neutral-60)] opacity-60'
    : 'inline-flex cursor-pointer items-center border border-[var(--color-primary)] px-3 py-2 text-xs font-bold uppercase text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-background)]';

  return (
    <div className="grid gap-3 border border-[var(--color-neutral-20)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase text-[var(--color-foreground)]">
            Local media
          </h3>
          <p className="text-xs text-[var(--color-neutral-60)]">
            Uploads stay local until publish.
          </p>
        </div>
        <label className={labelClassName}>
          <input
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
          Add media
        </label>
      </div>
      <MediaErrorMessage message={errorMessage} />
    </div>
  );
}

function MediaCard({
  media,
  pending,
  previewUrl,
  onDeleteMedia,
  onOpenPreview,
  onUpdateMedia,
}: {
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
    <section className="grid gap-3 border border-[var(--color-neutral-20)] p-3 md:grid-cols-[13rem_minmax(0,1fr)]">
      <MediaPreviewButton
        media={media}
        previewUrl={previewUrl}
        onOpenPreview={onOpenPreview}
      />

      <div className="min-w-0">
        <div className="grid gap-3 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <BuilderSelectField
            id={`builder-media-${media.id}-role`}
            label="Role"
            value={media.role}
            onChange={(role) => {
              void onUpdateMedia(media.id, {
                role: role as DappIndexMediaRole,
              });
            }}
          >
            {DAPP_INDEX_MEDIA_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </BuilderSelectField>
          <BuilderTextAreaField
            id={`builder-media-${media.id}-alt`}
            label="Alt text"
            maxLength={240}
            rows={2}
            value={media.alt ?? ''}
            onChange={(alt) => {
              void onUpdateMedia(media.id, { alt });
            }}
          />
          <BuilderTextAreaField
            id={`builder-media-${media.id}-caption`}
            label="Caption"
            maxLength={240}
            rows={2}
            value={media.caption ?? ''}
            onChange={(caption) => {
              void onUpdateMedia(media.id, { caption });
            }}
          />
          <button
            type="button"
            className="justify-self-start text-xs font-bold uppercase text-[var(--color-error)] md:pb-2"
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
      className="relative flex aspect-video h-32 w-full items-center justify-center overflow-hidden border border-[var(--color-neutral-20)] bg-[var(--color-background-elevated)] text-left transition-colors hover:border-[var(--color-primary)] disabled:cursor-default disabled:hover:border-[var(--color-neutral-20)] md:h-32"
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
        <p className="text-xs font-bold uppercase text-[var(--color-neutral-60)]">
          Preview unavailable
        </p>
      )}
      <MediaIdentity media={media} />
    </button>
  );
}

function MediaIdentity({ media }: { media: DraftMedia }) {
  return (
    <div className="absolute inset-x-0 bottom-0 min-w-0 space-y-1 bg-black/80 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="min-w-0 flex-1 truncate text-[0.6875rem] font-bold uppercase text-[var(--color-foreground)]">
          {media.name}
        </h4>
        <MediaBadge label={media.kind === 'video' ? 'Video' : 'Image'} />
        <MediaBadge label={media.role} />
      </div>
      <p className="truncate text-xs text-[var(--color-neutral-60)]">
        {media.id}
      </p>
    </div>
  );
}

function MediaPreviewModal({
  media,
  previewUrl,
  onClose,
}: {
  media: DraftMedia | null;
  previewUrl: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!media) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, onClose]);

  if (!media || !previewUrl) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
    >
      <div className="grid max-h-full w-full max-w-5xl gap-3 border border-[var(--color-neutral-30)] bg-[var(--color-background)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 break-words text-sm font-bold uppercase text-[var(--color-foreground)]">
            {media.name}
          </h3>
          <button
            type="button"
            className="text-xs font-bold uppercase text-[var(--color-primary)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex max-h-[75vh] min-h-0 items-center justify-center overflow-hidden bg-[var(--color-background-elevated)]">
          {media.kind === 'video' ? (
            <video
              className="max-h-[75vh] w-full object-contain"
              controls
              muted
              playsInline
              src={previewUrl}
            />
          ) : (
            <img
              alt={media.alt || media.name}
              className="max-h-[75vh] w-full object-contain"
              src={previewUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyMediaList() {
  return (
    <div className="space-y-1 border border-[var(--color-neutral-20)] p-4 text-sm text-[var(--color-neutral-70)]">
      <p>No local media added.</p>
      <p className="text-xs text-[var(--color-neutral-60)]">
        Add screenshots, logos, or a WebM demo.
      </p>
    </div>
  );
}

function MediaErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p className="text-xs text-[var(--color-error)]" role="alert">
      {message}
    </p>
  );
}

function MediaBadge({ label }: { label: string }) {
  return (
    <span className="border border-[var(--color-neutral-20)] px-2 py-1 text-[0.6875rem] font-bold uppercase text-[var(--color-neutral-70)]">
      {label}
    </span>
  );
}
