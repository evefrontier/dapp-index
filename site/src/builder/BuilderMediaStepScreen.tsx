import { Button } from '@evefrontier/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type {
  DraftMedia,
  DraftMediaUpdate,
} from '@/storage/draftStorage';
import {
  DAPP_INDEX_MEDIA_ROLES,
  type DappIndexMediaRole,
} from '@/types/dapp-index';

const ACCEPTED_MEDIA_TYPES = 'image/png,image/jpeg,image/webp,video/webm';
const MEDIA_FIELD_CLASS_NAME =
  'h-10 w-full border-0 border-b border-[var(--color-neutral-30)] bg-transparent px-0 py-2 text-sm text-[var(--color-foreground)] outline-none transition-colors focus:border-[var(--color-primary)]';

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
};

export function BuilderMediaStepScreen({
  errorMessage,
  media,
  pending,
  previewUrls,
  onDeleteMedia,
  onUpdateMedia,
}: BuilderMediaStepScreenProps) {
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    null,
  );
  const selectedPreview = media.find((item) => item.id === selectedPreviewId);
  const selectedPreviewUrl = selectedPreview
    ? previewUrls[selectedPreview.id] ?? null
    : null;

  return (
    <div className="grid gap-4">
      <MediaUploadNote errorMessage={errorMessage} />

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

export function BuilderMediaUploadAction({
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

function MediaUploadNote({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="grid gap-2">
      <p className="text-xs text-[var(--color-neutral-60)]">
        Uploads stay local until publish.
      </p>
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
    <section className="grid gap-3 border-t border-[var(--color-neutral-20)] py-3 first:border-t-0 first:pt-0 md:grid-cols-[13rem_minmax(0,1fr)]">
      <MediaPreviewButton
        media={media}
        previewUrl={previewUrl}
        onOpenPreview={onOpenPreview}
      />

      <div className="min-w-0">
        <div className="grid gap-3 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
          <MediaSelectField
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
          </MediaSelectField>
          <MediaTextField
            id={`builder-media-${media.id}-alt`}
            label="Alt text"
            maxLength={240}
            value={media.alt ?? ''}
            onChange={(alt) => {
              void onUpdateMedia(media.id, { alt });
            }}
          />
          <MediaTextField
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
            className="self-start justify-self-start pt-1 text-xs font-bold uppercase text-[var(--color-error)]"
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

function MediaSelectField({
  children,
  id,
  label,
  value,
  onChange,
}: {
  children: ReactNode;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <MediaFieldLabel id={id} label={label} />
      <select
        className={MEDIA_FIELD_CLASS_NAME}
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
    </div>
  );
}

function MediaTextField({
  id,
  label,
  maxLength,
  value,
  onChange,
}: {
  id: string;
  label: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <MediaFieldLabel id={id} label={label} />
      <input
        className={MEDIA_FIELD_CLASS_NAME}
        id={id}
        maxLength={maxLength}
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

function MediaFieldLabel({ id, label }: { id: string; label: string }) {
  return (
    <label
      className="text-xs font-bold uppercase text-[var(--color-neutral-60)]"
      htmlFor={id}
    >
      {label}
    </label>
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
