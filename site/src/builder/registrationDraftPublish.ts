import type { DraftMedia } from '@/storage/draftStorage';
import type {
  DappIndexImageMediaItem,
  DappIndexImageMimeType,
  DappIndexMediaGallery,
  DappIndexVideoMediaItem,
  DappIndexVideoMimeType,
} from '@/types/dapp-index';
import {
  validateRegistryMetadataJson,
  type RegistryMetadataValidation,
} from '@/utils/registryMetadata';
import type {
  RegistrationDraftMetadataJson,
  RegistrationDraftSlugCheckState,
} from './registrationDraftReview';

export type RegistrationPublishAction = 'register' | 'update';

export type RegistrationPublishIssue = {
  id: string;
  label: string;
  message: string;
  severity: 'error' | 'warning';
};

export type RegistrationPublishMediaAsset = {
  media: DraftMedia;
  walrusBlobId: string;
  walrusUrl: string;
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

export type RegistrationPublishActionResult =
  | { ok: true; action: RegistrationPublishAction }
  | { ok: false; message: string };

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
    return normalizedAddress(slugCheck.owner) === normalizedAddress(walletAddress)
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
  walrusAggregatorUrl,
}: {
  registryConfigured: boolean;
  reviewReady: boolean;
  suiNetwork: string;
  walletAddress: string | null;
  walletNetwork?: string | null;
  walrusAggregatorUrl: string | null;
}): RegistrationPublishReadiness {
  const blockers: string[] = [];

  if (!reviewReady) blockers.push('Fix review blockers first.');
  if (!walletAddress) blockers.push('Connect a wallet to publish.');
  if (!registryConfigured) {
    blockers.push('Configure registry package and object env vars.');
  }
  if (!isWalrusSupportedNetwork(suiNetwork)) {
    blockers.push('Walrus publish supports testnet or mainnet.');
  }
  if (!walrusAggregatorUrl) {
    blockers.push('Configure a Walrus aggregator URL.');
  }
  if (walletAddress && walletNetwork && walletNetwork !== suiNetwork) {
    blockers.push(`Switch wallet network to ${suiNetwork}.`);
  }

  return {
    blockers,
    ready: blockers.length === 0,
  };
}

export function hexToBytes(hex: string): Uint8Array {
  const value = hex.trim();
  if (value.length % 2 !== 0) {
    throw new Error('Hex strings must have an even number of characters.');
  }
  if (!/^[0-9a-fA-F]*$/.test(value)) {
    throw new Error('Metadata hash must be valid hex.');
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

export function isWalrusSupportedNetwork(
  network: string,
): network is 'testnet' | 'mainnet' {
  return network === 'testnet' || network === 'mainnet';
}

export function walrusBlobUri(blobId: string): `walrus://blob/${string}` {
  return `walrus://blob/${blobId}`;
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
          message: 'Add at least one image so videos have a poster.',
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
    uri: walrusBlobUri(asset.walrusBlobId),
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
        uri: walrusBlobUri(asset.walrusBlobId),
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

function createMediaGalleryPointers(
  imageItems: DappIndexImageMediaItem[],
): Pick<DappIndexMediaGallery, 'hero' | 'thumbnail'> {
  const thumbnail = imageItems.find((item) => item.role === 'thumbnail');
  const hero = imageItems.find((item) => item.role === 'hero');

  return {
    ...(thumbnail ? { thumbnail: thumbnail.id } : {}),
    ...(hero ? { hero: hero.id } : {}),
  };
}

function selectVideoPoster(
  imageItems: DappIndexImageMediaItem[],
): DappIndexImageMediaItem | null {
  return (
    imageItems.find((item) => item.role === 'hero') ??
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
  return (schemaValidation.errors ?? []).map((error, index) => ({
    id: `schema.${error.instancePath || 'root'}.${error.keyword}.${index}`,
    label: 'Metadata',
    message: error.message
      ? `Schema ${error.message}.`
      : 'Schema validation failed.',
    severity: 'error',
  }));
}

function normalizedAddress(address: string): string {
  return address.trim().toLowerCase();
}

function isBlockingIssue(issue: RegistrationPublishIssue): boolean {
  return issue.severity === 'error';
}
