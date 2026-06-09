import type { DraftMediaKind } from '@/storage/draftStorage';
import {
  LISTING_MEDIA_IMAGE_MAX_BYTES,
  LISTING_MEDIA_VIDEO_MAX_BYTES,
  PUBLIC_MEDIA_ITEM_LIMIT,
  PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES,
  PUBLIC_MEDIA_VIDEO_LIMIT,
} from '@/constants';
import type { DappIndexMediaRole } from '@/types/dapp-index';

export type MediaRoleOption = {
  role: DappIndexMediaRole;
  label: string;
  description: string;
  kinds: readonly DraftMediaKind[];
};

export const MEDIA_ROLE_OPTIONS: readonly MediaRoleOption[] = [
  {
    role: 'thumbnail',
    label: 'Thumbnail',
    description: 'Small image on catalog cards. Only one per listing.',
    kinds: ['screenshot'],
  },
  {
    role: 'hero',
    label: 'Hero',
    description: 'Large banner on the listing detail page. Only one per listing.',
    kinds: ['screenshot'],
  },
  {
    role: 'gallery',
    label: 'Gallery',
    description: 'Extra screenshots or stills in the public gallery.',
    kinds: ['screenshot', 'video'],
  },
  {
    role: 'demo',
    label: 'Demo',
    description: 'WebM walkthrough shown on the detail page.',
    kinds: ['video'],
  },
  {
    role: 'logo',
    label: 'Logo',
    description: 'Project or app logo image.',
    kinds: ['screenshot'],
  },
] as const;

export function getMediaRoleOptionsForKind(
  kind: DraftMediaKind,
): readonly MediaRoleOption[] {
  return MEDIA_ROLE_OPTIONS.filter((option) => option.kinds.includes(kind));
}

export function getMediaRoleOption(
  role: DappIndexMediaRole,
): MediaRoleOption | undefined {
  return MEDIA_ROLE_OPTIONS.find((option) => option.role === role);
}

export function getMediaRoleLabel(role: DappIndexMediaRole): string {
  return getMediaRoleOption(role)?.label ?? role;
}

export function getDefaultMediaRoleForKind(
  kind: DraftMediaKind,
): DappIndexMediaRole {
  return kind === 'video' ? 'demo' : 'gallery';
}

function formatMediaByteLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Copy and limits for the builder media step (aligned with published metadata). */
export const MEDIA_STEP_GUIDANCE = {
  imageLimit: formatMediaByteLimit(LISTING_MEDIA_IMAGE_MAX_BYTES),
  videoLimit: formatMediaByteLimit(LISTING_MEDIA_VIDEO_MAX_BYTES),
  totalLimit: formatMediaByteLimit(PUBLIC_MEDIA_TOTAL_SIZE_LIMIT_BYTES),
  itemLimit: PUBLIC_MEDIA_ITEM_LIMIT,
  videoLimitCount: PUBLIC_MEDIA_VIDEO_LIMIT,
} as const;
