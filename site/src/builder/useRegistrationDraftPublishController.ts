import { useConnection } from '@evefrontier/dapp-kit';
import {
  CurrentAccountSigner,
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  registryConfigured,
  vitePackageId,
  viteRegistryId,
  viteSuiNetwork,
  viteWalrusAggregatorUrl,
  viteWalrusUploadRelayHost,
} from '@/chain/env';
import {
  buildRegisterAppTransaction,
  buildUpdateAppTransaction,
} from '@/chain/registerTransactions';
import { lookupRegistrySlug } from '@/chain/slugLookup';
import { txResultDigest } from '@/chain/txDigest';
import { createWalrusSuiClient, walrusBlobReadUrl } from '@/chain/walrusClient';
import type {
  Draft,
  DraftMedia,
  DraftPublishedMediaCheckpoint,
  DraftStorage,
} from '@/storage/draftStorage';
import { canonicalStringify } from '@/utils/canonicalJson';
import { getErrorMessage } from './errors';
import {
  buildRegistrationPublishMetadata,
  createRegistrationPublishReadiness,
  hexToBytes,
  isWalrusSupportedNetwork,
  resolveRegistrationPublishAction,
  walrusBlobUri,
  type RegistrationPublishAction,
  type RegistrationPublishMediaAsset,
  type RegistrationPublishReadiness,
} from './registrationDraftPublish';
import type { RegistrationDraftFields } from './registrationDraftFields';
import {
  buildRegistrationDraftMetadata,
  createRegistrationMetadataHashHex,
  type RegistrationDraftMetadataJson,
  type RegistrationDraftReview,
  type RegistrationDraftSlugCheckState,
} from './registrationDraftReview';

const WALRUS_STORAGE_EPOCHS = 5;

export type RegistrationDraftPublishState =
  | {
      status: 'idle';
      action: null;
      errorMessage: null;
      metadataHash: string | null;
      metadataUri: `walrus://blob/${string}` | null;
      metadataWalrusUrl: string | null;
      stage: string;
      suiTransactionDigest: string | null;
    }
  | {
      status: 'publishing';
      action: RegistrationPublishAction | null;
      errorMessage: null;
      metadataHash: string | null;
      metadataUri: `walrus://blob/${string}` | null;
      metadataWalrusUrl: string | null;
      stage: string;
      suiTransactionDigest: string | null;
    }
  | {
      status: 'success';
      action: RegistrationPublishAction;
      errorMessage: null;
      metadataHash: string;
      metadataUri: `walrus://blob/${string}`;
      metadataWalrusUrl: string;
      stage: string;
      suiTransactionDigest: string;
    }
  | {
      status: 'error';
      action: RegistrationPublishAction | null;
      errorMessage: string;
      metadataHash: string | null;
      metadataUri: `walrus://blob/${string}` | null;
      metadataWalrusUrl: string | null;
      stage: string;
      suiTransactionDigest: string | null;
    };

export type RegistrationDraftPublishController = {
  publishReadiness: RegistrationPublishReadiness;
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletNetwork: string | null;
  onConnectWallet: () => void;
  onPublish: () => Promise<void>;
};

export type RegistrationDraftPublishControllerOptions = {
  autosave: { flush(): Promise<Draft | null> };
  draft: Draft | null;
  fields: RegistrationDraftFields;
  review: RegistrationDraftReview;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  storage: DraftStorage;
};

type PublishStageSetter = (stage: string) => void;

type LocalMediaDescriptor = {
  content: Blob;
  media: DraftMedia;
  sha256: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSeconds?: number;
};

type WalrusUploader = (input: {
  bytes: Uint8Array;
  contentType: string;
  name: string;
}) => Promise<{
  walrusBlobId: string;
  walrusUrl: string;
}>;

const INITIAL_PUBLISH_STATE: RegistrationDraftPublishState = {
  status: 'idle',
  action: null,
  errorMessage: null,
  metadataHash: null,
  metadataUri: null,
  metadataWalrusUrl: null,
  stage: 'Ready.',
  suiTransactionDigest: null,
};

export function useRegistrationDraftPublishController({
  autosave,
  draft,
  fields,
  review,
  setDraft,
  storage,
}: RegistrationDraftPublishControllerOptions): RegistrationDraftPublishController {
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const currentWalletNetwork = useCurrentNetwork();
  const { handleConnect } = useConnection();
  const [publishState, setPublishState] =
    useState<RegistrationDraftPublishState>(INITIAL_PUBLISH_STATE);
  const suiNetwork = viteSuiNetwork();
  const walrusAggregatorUrl = viteWalrusAggregatorUrl() ?? null;
  const walletAddress = currentAccount?.address ?? null;
  const publishReadiness = useMemo(() => {
    const readiness = createRegistrationPublishReadiness({
      registryConfigured: registryConfigured(),
      reviewReady: review.ready,
      suiNetwork,
      walletAddress,
      walletNetwork: walletAddress ? currentWalletNetwork : null,
      walrusAggregatorUrl,
    });
    const mediaBlockers = getDraftMediaPublishBlockers(draft?.media ?? []);

    return {
      blockers: [...readiness.blockers, ...mediaBlockers],
      ready: readiness.ready && mediaBlockers.length === 0,
    };
  }, [
    currentWalletNetwork,
    draft?.media,
    review.ready,
    suiNetwork,
    walletAddress,
    walrusAggregatorUrl,
  ]);

  const setPublishingStage = useCallback((stage: string) => {
    setPublishState((current) => ({
      status: 'publishing',
      action: current.action,
      errorMessage: null,
      metadataHash: current.metadataHash,
      metadataUri: current.metadataUri,
      metadataWalrusUrl: current.metadataWalrusUrl,
      stage,
      suiTransactionDigest: current.suiTransactionDigest,
    }));
  }, []);

  const onPublish = useCallback(async () => {
    if (!draft || publishState.status === 'publishing') return;

    if (!publishReadiness.ready) {
      setPublishState({
        status: 'error',
        action: null,
        errorMessage: publishReadiness.blockers.join(' '),
        metadataHash: null,
        metadataUri: null,
        metadataWalrusUrl: null,
        stage: 'Blocked.',
        suiTransactionDigest: null,
      });
      return;
    }

    const packageId = vitePackageId();
    const registryId = viteRegistryId();
    if (!packageId || !registryId || !walletAddress) return;
    if (!isWalrusSupportedNetwork(suiNetwork) || !walrusAggregatorUrl) return;

    setPublishState({
      status: 'publishing',
      action: null,
      errorMessage: null,
      metadataHash: null,
      metadataUri: null,
      metadataWalrusUrl: null,
      stage: 'Saving draft.',
      suiTransactionDigest: null,
    });

    try {
      const savedDraft = await autosave.flush();
      if (!savedDraft) throw new Error('Draft not found.');

      const signer = new CurrentAccountSigner(dAppKit);
      const walrusClient = createWalrusSuiClient({
        network: suiNetwork,
        uploadRelayHost: viteWalrusUploadRelayHost(),
      });
      const uploadBlob: WalrusUploader = async ({ bytes, contentType, name }) => {
        const result = await walrusClient.walrus.writeBlob({
          blob: bytes,
          deletable: false,
          epochs: WALRUS_STORAGE_EPOCHS,
          owner: walletAddress,
          signer,
          attributes: {
            contentType,
            name,
          },
        });

        return {
          walrusBlobId: result.blobId,
          walrusUrl: walrusBlobReadUrl(walrusAggregatorUrl, result.blobId),
        };
      };

      const slugCheck = await checkPublishSlug(fields.slug, setPublishingStage);
      const publishAction = resolveRegistrationPublishAction({
        slugCheck,
        walletAddress,
      });
      if (!publishAction.ok) throw new Error(publishAction.message);

      setPublishState((current) => ({
        status: 'publishing',
        action: publishAction.action,
        errorMessage: null,
        metadataHash: current.metadataHash,
        metadataUri: current.metadataUri,
        metadataWalrusUrl: current.metadataWalrusUrl,
        stage: current.stage,
        suiTransactionDigest: current.suiTransactionDigest,
      }));

      const baseMetadata = buildRegistrationDraftMetadata(fields);
      const mediaAssets = await createUploadedMediaAssets({
        baseMetadata,
        draft: savedDraft,
        setStage: setPublishingStage,
        storage,
        uploadBlob,
      });
      const publishMetadata = buildRegistrationPublishMetadata({
        baseMetadata,
        mediaAssets,
      });
      if (!publishMetadata.ready) {
        throw new Error(formatPublishIssueMessages(publishMetadata.issues));
      }

      setPublishingStage('Hashing metadata.');
      const metadataHash = await createRegistrationMetadataHashHex(
        publishMetadata.metadata,
      );
      const metadataUpload = await uploadMetadataJson({
        draft: savedDraft,
        metadata: publishMetadata.metadata,
        metadataHash,
        setStage: setPublishingStage,
        storage,
        uploadBlob,
      });
      const metadataUri = walrusBlobUri(metadataUpload.walrusBlobId);

      setPublishState((current) => ({
        status: 'publishing',
        action: current.action,
        errorMessage: null,
        metadataHash,
        metadataUri,
        metadataWalrusUrl: metadataUpload.walrusUrl,
        stage: current.stage,
        suiTransactionDigest: current.suiTransactionDigest,
      }));
      setPublishingStage(
        publishAction.action === 'register'
          ? 'Registering on Sui.'
          : 'Updating on Sui.',
      );

      const txInput = {
        packageId,
        registryId,
        slug: fields.slug.trim().toLowerCase(),
        metadataUri,
        metadataHash: hexToBytes(metadataHash),
        categories: [...fields.categories],
      };
      const tx =
        publishAction.action === 'register'
          ? buildRegisterAppTransaction(txInput)
          : buildUpdateAppTransaction(txInput);
      const txResult = await dAppKit.signAndExecuteTransaction({
        transaction: tx,
      });
      const suiTransactionDigest = txResultDigest(txResult);

      await storage.savePublishCheckpoint(savedDraft.id, {
        suiTransactionDigest,
      });
      await storage.clearPublishedDraft(savedDraft.id);
      setDraft((currentDraft) =>
        currentDraft?.id === savedDraft.id
          ? {
              ...savedDraft,
              status: 'published',
              publish: {
                ...savedDraft.publish,
                metadataHash,
                metadataUri,
                suiTransactionDigest,
                walrusBlobId: metadataUpload.walrusBlobId,
                walrusUrl: metadataUpload.walrusUrl,
              },
            }
          : currentDraft,
      );
      setPublishState({
        status: 'success',
        action: publishAction.action,
        errorMessage: null,
        metadataHash,
        metadataUri,
        metadataWalrusUrl: metadataUpload.walrusUrl,
        stage: 'Published.',
        suiTransactionDigest,
      });
    } catch (caughtError) {
      setPublishState((current) => ({
        status: 'error',
        action: current.action,
        errorMessage: getErrorMessage(
          caughtError,
          'Could not publish listing.',
        ),
        metadataHash: current.metadataHash,
        metadataUri: current.metadataUri,
        metadataWalrusUrl: current.metadataWalrusUrl,
        stage: 'Failed.',
        suiTransactionDigest: current.suiTransactionDigest,
      }));
    }
  }, [
    autosave,
    dAppKit,
    draft,
    fields,
    publishReadiness,
    publishState.status,
    setDraft,
    setPublishingStage,
    storage,
    suiNetwork,
    walletAddress,
    walrusAggregatorUrl,
  ]);

  return {
    publishReadiness,
    publishState,
    suiNetwork,
    walletAddress,
    walletNetwork: walletAddress ? currentWalletNetwork : null,
    onConnectWallet: handleConnect,
    onPublish,
  };
}

function getDraftMediaPublishBlockers(media: DraftMedia[]): string[] {
  if (
    media.some((item) => item.kind === 'video') &&
    !media.some((item) => item.kind === 'screenshot')
  ) {
    return ['Add at least one image so videos have a poster.'];
  }
  return [];
}

async function checkPublishSlug(
  slug: string,
  setStage: PublishStageSetter,
): Promise<RegistrationDraftSlugCheckState> {
  const normalizedSlug = slug.trim().toLowerCase();
  setStage('Checking slug.');
  const result = await lookupRegistrySlug(normalizedSlug);

  switch (result.status) {
    case 'available':
      return {
        status: 'available',
        checkedSlug: normalizedSlug,
        message: 'Slug is available.',
      };
    case 'taken':
      return {
        status: 'taken',
        checkedSlug: normalizedSlug,
        owner: result.listing.owner,
        message: `Owned by ${result.listing.owner}.`,
      };
    case 'unconfigured':
      return {
        status: 'unconfigured',
        message: 'Registry env is not configured.',
      };
    case 'error':
      return {
        status: 'error',
        message: result.message,
      };
    default:
      return assertNever(result);
  }
}

async function createUploadedMediaAssets({
  baseMetadata,
  draft,
  setStage,
  storage,
  uploadBlob,
}: {
  baseMetadata: RegistrationDraftMetadataJson;
  draft: Draft;
  setStage: PublishStageSetter;
  storage: DraftStorage;
  uploadBlob: WalrusUploader;
}): Promise<RegistrationPublishMediaAsset[]> {
  if (draft.media.length === 0) return [];

  setStage('Reading local media.');
  const descriptors = await Promise.all(
    draft.media.map((media) => readLocalMediaDescriptor(draft.id, media, storage)),
  );
  const preflight = buildRegistrationPublishMetadata({
    baseMetadata,
    mediaAssets: descriptors.map((descriptor) => ({
      ...descriptor,
      walrusBlobId: `preview-${descriptor.media.id}`,
      walrusUrl: `preview://${descriptor.media.id}`,
    })),
  });
  if (!preflight.ready) {
    throw new Error(formatPublishIssueMessages(preflight.issues));
  }

  const checkpoints = [...(draft.publish?.media ?? [])];
  const assets: RegistrationPublishMediaAsset[] = [];
  for (const descriptor of descriptors) {
    const checkpoint = findMatchingMediaCheckpoint(checkpoints, descriptor);
    if (checkpoint) {
      assets.push({
        media: descriptor.media,
        walrusBlobId: checkpoint.walrusBlobId,
        walrusUrl: checkpoint.walrusUrl,
        sha256: descriptor.sha256,
        sizeBytes: descriptor.sizeBytes,
        width: descriptor.width,
        height: descriptor.height,
        durationSeconds: descriptor.durationSeconds,
      });
      continue;
    }

    setStage(`Uploading ${descriptor.media.name}.`);
    const bytes = new Uint8Array(await descriptor.content.arrayBuffer());
    const upload = await uploadBlob({
      bytes,
      contentType: descriptor.media.mimeType,
      name: descriptor.media.name,
    });
    const nextCheckpoint: DraftPublishedMediaCheckpoint = {
      mediaId: descriptor.media.id,
      walrusBlobId: upload.walrusBlobId,
      walrusUrl: upload.walrusUrl,
      sha256: descriptor.sha256,
      sizeBytes: descriptor.sizeBytes,
      width: descriptor.width,
      height: descriptor.height,
      durationSeconds: descriptor.durationSeconds,
    };
    checkpoints.push(nextCheckpoint);
    await storage.savePublishCheckpoint(draft.id, { media: checkpoints });
    assets.push({
      media: descriptor.media,
      walrusBlobId: upload.walrusBlobId,
      walrusUrl: upload.walrusUrl,
      sha256: descriptor.sha256,
      sizeBytes: descriptor.sizeBytes,
      width: descriptor.width,
      height: descriptor.height,
      durationSeconds: descriptor.durationSeconds,
    });
  }

  return assets;
}

async function uploadMetadataJson({
  draft,
  metadata,
  metadataHash,
  setStage,
  storage,
  uploadBlob,
}: {
  draft: Draft;
  metadata: RegistrationDraftMetadataJson;
  metadataHash: string;
  setStage: PublishStageSetter;
  storage: DraftStorage;
  uploadBlob: WalrusUploader;
}): Promise<{
  walrusBlobId: string;
  walrusUrl: string;
}> {
  if (
    draft.publish?.metadataHash === metadataHash &&
    draft.publish.walrusBlobId &&
    draft.publish.walrusUrl
  ) {
    return {
      walrusBlobId: draft.publish.walrusBlobId,
      walrusUrl: draft.publish.walrusUrl,
    };
  }

  setStage('Uploading metadata.');
  const bytes = new TextEncoder().encode(canonicalStringify(metadata));
  const upload = await uploadBlob({
    bytes,
    contentType: 'application/json',
    name: `${String(metadata.id ?? 'listing')}.json`,
  });
  await storage.savePublishCheckpoint(draft.id, {
    metadataHash,
    metadataUri: walrusBlobUri(upload.walrusBlobId),
    walrusBlobId: upload.walrusBlobId,
    walrusUrl: upload.walrusUrl,
  });

  return upload;
}

async function readLocalMediaDescriptor(
  draftId: string,
  media: DraftMedia,
  storage: DraftStorage,
): Promise<LocalMediaDescriptor> {
  const content = await storage.getLocalMedia(draftId, media.id);
  if (!content) {
    throw new Error(`Local media is missing for ${media.name}.`);
  }

  const [sha256, dimensions] = await Promise.all([
    sha256BlobHex(content),
    readMediaDimensions(content, media),
  ]);

  return {
    content,
    media,
    sha256,
    sizeBytes: content.size,
    ...dimensions,
  };
}

async function readMediaDimensions(
  content: Blob,
  media: DraftMedia,
): Promise<{
  width: number;
  height: number;
  durationSeconds?: number;
}> {
  return media.kind === 'video'
    ? readVideoDimensions(content)
    : readImageDimensions(content);
}

function readImageDimensions(content: Blob): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(content);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions.'));
    };
    image.src = url;
  });
}

function readVideoDimensions(content: Blob): Promise<{
  width: number;
  height: number;
  durationSeconds: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(content);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const durationSeconds = video.duration;
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        reject(new Error('Could not read video duration.'));
        return;
      }
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSeconds,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata.'));
    };
    video.src = url;
  });
}

async function sha256BlobHex(content: Blob): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await content.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function findMatchingMediaCheckpoint(
  checkpoints: DraftPublishedMediaCheckpoint[],
  descriptor: LocalMediaDescriptor,
): DraftPublishedMediaCheckpoint | null {
  return (
    checkpoints.find(
      (checkpoint) =>
        checkpoint.mediaId === descriptor.media.id &&
        checkpoint.sha256 === descriptor.sha256 &&
        checkpoint.sizeBytes === descriptor.sizeBytes &&
        checkpoint.width === descriptor.width &&
        checkpoint.height === descriptor.height &&
        checkpoint.durationSeconds === descriptor.durationSeconds,
    ) ?? null
  );
}

function formatPublishIssueMessages(
  issues: { label: string; message: string }[],
): string {
  return issues.length > 0
    ? issues.map((issue) => `${issue.label}: ${issue.message}`).join(' ')
    : 'Metadata is not ready to publish.';
}

function assertNever(value: never): never {
  throw new Error(`Unhandled publish state: ${String(value)}`);
}
