import { isSameSuiAddress } from '@/chain/suiAddress';
import type {
  DraftMedia,
  DraftPublishedMediaCheckpoint,
  DraftPublishCheckpoint,
} from '@/storage/draftStorage';
import type {
  DappIndexImageMediaItem,
  DappIndexImageMimeType,
  DappIndexMediaGallery,
  DappIndexMediaUri,
  DappIndexVideoMediaItem,
  DappIndexVideoMimeType,
} from '@/types/dapp-index';
import {
  validateRegistryMetadataJson,
  type RegistryMetadataValidation,
} from '@/utils/registryMetadata';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import { createSchemaValidationIssues } from '@/utils/schemaValidationIssues';
import type { RegistrationDraftMetadataJson } from './registrationDraftReview';
import type { RegistrationDraftSlugCheckState } from './registrationDraftSlugCheck';

export type RegistrationPublishAction = 'register' | 'update';

export type RegistrationPublishIssue = {
  id: string;
  label: string;
  message: string;
  severity: 'error' | 'warning';
};

export type RegistrationPublishMediaAsset = {
  media: DraftMedia;
  storageUri: string;
  sha256: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSeconds?: number;
  codecs?: string;
};

export type RegistrationPublishMetadataResult = {
  issues: RegistrationPublishIssue[];
  metadata: RegistrationDraftMetadataJson;
  ready: boolean;
  schemaValidation: RegistryMetadataValidation;
};

export type RegistrationPublishReadiness = {
  blockers: string[];
  ready: boolean;
};

export const VIDEO_POSTER_BLOCKER_MESSAGE =
  'Add at least one image so videos have a poster.';

export function getDraftVideoPosterBlockers(
  media: Pick<DraftMedia, 'kind'>[],
): string[] {
  const hasVideo = media.some((item) => item.kind === 'video');
  const hasImage = media.some((item) => item.kind === 'screenshot');
  if (hasVideo && !hasImage) {
    return [VIDEO_POSTER_BLOCKER_MESSAGE];
  }
  return [];
}

export type RegistrationPublishActionResult =
  | { ok: true; action: RegistrationPublishAction }
  | { ok: false; message: string };

export function getReusableS3StorageUri(
  checkpoint: Pick<DraftPublishedMediaCheckpoint, 'storageUri'>,
): string | null {
  return checkpoint.storageUri
    ? resolveMediaUrl(checkpoint.storageUri)
    : null;
}

export function resolvePublishedMetadataPublicUrl(
  checkpoint: Pick<DraftPublishCheckpoint, 'storageUri' | 'walrusUrl'>,
): string | null {
  for (const uri of [checkpoint.storageUri, checkpoint.walrusUrl]) {
    if (!uri) continue;
    const publicUrl = resolveMediaUrl(uri);
    if (publicUrl) return publicUrl;
  }
  return null;
}

export function buildRegistrationPublishMetadata({
  baseMetadata,
  mediaAssets,
}: {
  baseMetadata: RegistrationDraftMetadataJson;
  mediaAssets: RegistrationPublishMediaAsset[];
}): RegistrationPublishMetadataResult {
  const issues: RegistrationPublishIssue[] = [];
  const metadata: RegistrationDraftMetadataJson = { ...baseMetadata };
  const mediaGallery = buildMediaGallery(mediaAssets, issues);

  if (mediaGallery.items.length > 0) {
    metadata.media = mediaGallery;
  }

  const schemaValidation = validateRegistryMetadataJson(metadata);
  if (!schemaValidation.ok) {
    issues.push(...createSchemaPublishIssues(schemaValidation));
  }

  return {
    issues,
    metadata,
    ready: schemaValidation.ok && !issues.some(isBlockingIssue),
    schemaValidation,
  };
}

export function resolveRegistrationPublishAction({
  slugCheck,
  walletAddress,
}: {
  slugCheck: RegistrationDraftSlugCheckState;
  walletAddress: string;
}): RegistrationPublishActionResult {
  if (slugCheck.status === 'available') {
    return { ok: true, action: 'register' };
  }

  if (slugCheck.status === 'taken') {
    return isSameSuiAddress(slugCheck.owner, walletAddress)
      ? { ok: true, action: 'update' }
      : { ok: false, message: 'Slug is already owned by another wallet.' };
  }

  if (slugCheck.status === 'unconfigured') {
    return { ok: false, message: 'Registry env is not configured.' };
  }

  if (slugCheck.status === 'error') {
    return { ok: false, message: slugCheck.message };
  }

  return { ok: false, message: 'Check the slug before publishing.' };
}

export function createRegistrationPublishReadiness({
  registryConfigured,
  reviewReady,
  suiNetwork,
  walletAddress,
  walletNetwork,
  uploadApiBase,
  walletBalanceBlockers = [],
}: {
  registryConfigured: boolean;
  reviewReady: boolean;
  suiNetwork: string;
  walletAddress: string | null;
  walletNetwork?: string | null;
  uploadApiBase: string | null;
  walletBalanceBlockers?: string[];
}): RegistrationPublishReadiness {
  const blockers: string[] = [];

  if (!reviewReady) blockers.push('Fix review blockers first.');
  if (!walletAddress) blockers.push('Connect a wallet to publish.');
  if (!registryConfigured) {
    blockers.push('Configure registry package and object env vars.');
  }
  if (suiNetwork !== 'testnet' && suiNetwork !== 'mainnet') {
    blockers.push('Publish supports testnet or mainnet.');
  }
  if (!uploadApiBase) {
    blockers.push('Configure VITE_UPLOAD_API_BASE for media uploads.');
  }
  if (walletAddress && walletNetwork && walletNetwork !== suiNetwork) {
    blockers.push(`Switch wallet network to ${suiNetwork}.`);
  }
  blockers.push(...walletBalanceBlockers);

  return {
    blockers,
    ready: blockers.length === 0,
  };
}

export function getPublishNextBlockerMessage(
  readiness: RegistrationPublishReadiness,
  options?: { isPublishing?: boolean },
): string | null {
  if (options?.isPublishing || readiness.ready) {
    return null;
  }
  return readiness.blockers[0] ?? null;
}

function buildMediaGallery(
  mediaAssets: RegistrationPublishMediaAsset[],
  issues: RegistrationPublishIssue[],
): DappIndexMediaGallery {
  const imageItems = mediaAssets
    .filter(isImageMediaAsset)
    .map(createImageMediaItem);
  const poster = selectVideoPoster(imageItems);
  const videoItems = mediaAssets
    .filter(isVideoMediaAsset)
    .flatMap((asset) => {
      if (!poster) {
        issues.push({
          id: 'media.videoPoster',
          label: 'Video poster',
          message: VIDEO_POSTER_BLOCKER_MESSAGE,
          severity: 'error',
        });
        return [];
      }
      if (!asset.durationSeconds || asset.durationSeconds <= 0) {
        issues.push({
          id: `media.${asset.media.id}.duration`,
          label: 'Video duration',
          message: 'Could not read the video duration.',
          severity: 'error',
        });
        return [];
      }

      return [createVideoMediaItem(asset, poster)];
    });

  return {
    ...createMediaGalleryPointers(imageItems),
    items: [...imageItems, ...videoItems],
  };
}

function createImageMediaItem(
  asset: RegistrationPublishMediaAsset,
): DappIndexImageMediaItem {
  return {
    id: asset.media.id,
    kind: 'image',
    role: asset.media.role,
    uri: asMediaUri(asset.storageUri),
    mimeType: asset.media.mimeType as DappIndexImageMimeType,
    sha256: asset.sha256,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    alt: normalizeAltText(asset.media),
    ...optionalCaption(asset.media.caption),
  };
}

function createVideoMediaItem(
  asset: RegistrationPublishMediaAsset,
  poster: DappIndexImageMediaItem,
): DappIndexVideoMediaItem {
  return {
    id: asset.media.id,
    kind: 'video',
    role: asset.media.role,
    poster: imageItemToImageAsset(poster),
    sources: [
      {
        uri: asMediaUri(asset.storageUri),
        mimeType: asset.media.mimeType as DappIndexVideoMimeType,
        sha256: asset.sha256,
        sizeBytes: asset.sizeBytes,
        width: asset.width,
        height: asset.height,
        durationSeconds: asset.durationSeconds ?? 0,
        ...optionalCodecs(asset.codecs),
      },
    ],
    ...optionalCaption(asset.media.caption),
  };
}

function asMediaUri(uri: string): DappIndexMediaUri {
  return uri as DappIndexMediaUri;
}

function createMediaGalleryPointers(
  imageItems: DappIndexImageMediaItem[],
): Partial<Pick<DappIndexMediaGallery, 'thumbnail'>> {
  const thumbnail = imageItems.find((item) => item.role === 'thumbnail');

  return {
    ...(thumbnail ? { thumbnail: thumbnail.id } : {}),
  };
}

function selectVideoPoster(
  imageItems: DappIndexImageMediaItem[],
): DappIndexImageMediaItem | null {
  return (
    imageItems.find((item) => item.role === 'thumbnail') ??
    imageItems[0] ??
    null
  );
}

function imageItemToImageAsset(item: DappIndexImageMediaItem) {
  const { id: _id, kind: _kind, role: _role, ...asset } = item;
  return asset;
}

function isImageMediaAsset(asset: RegistrationPublishMediaAsset): boolean {
  return asset.media.kind === 'screenshot';
}

function isVideoMediaAsset(asset: RegistrationPublishMediaAsset): boolean {
  return asset.media.kind === 'video';
}

function normalizeAltText(media: DraftMedia): string {
  return media.alt?.trim() || media.name.trim() || media.id;
}

function optionalCaption(
  caption: string | undefined,
): { caption?: string } {
  const value = caption?.trim();
  return value ? { caption: value } : {};
}

function optionalCodecs(codecs: string | undefined): { codecs?: string } {
  const value = codecs?.trim();
  return value ? { codecs: value } : {};
}

function createSchemaPublishIssues(
  schemaValidation: Extract<RegistryMetadataValidation, { ok: false }>,
): RegistrationPublishIssue[] {
  return createSchemaValidationIssues(schemaValidation);
}

function isBlockingIssue(issue: RegistrationPublishIssue): boolean {
  return issue.severity === 'error';
}
