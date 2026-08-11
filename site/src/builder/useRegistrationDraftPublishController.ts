import { useConnection } from '@evefrontier/dapp-kit';
import {
  CurrentAccountSigner,
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { hexToBytes } from '@/chain/bytes';
import { normalizeRegistrySlug } from '@/chain/normalizeRegistrySlug';
import {
  getPublishWalletBalanceBlockers,
  type PublishWalletBalanceUiState,
} from '@/chain/publishWalletBalances';
import {
  registryConfigured,
  vitePackageId,
  viteRegistryId,
  viteSuiNetwork,
  viteUploadApiBase,
} from '@/chain/env';
import {
  buildRegisterAppTransaction,
  buildUpdateAppTransaction,
} from '@/chain/registerTransactions';
import { lookupRegistrySlug } from '@/chain/slugLookup';
import { requireSuccessfulTxDigest } from '@/chain/txDigest';
import type {
  Draft,
  DraftPublishedMediaCheckpoint,
  DraftStorage,
} from '@/storage/draftStorage';
import { readLocalMediaDescriptor } from '@/storage/localMediaProbe';
import {
  stableMediaFilename,
  uploadManifestToS3,
  uploadMediaToS3,
} from '@/storage/s3MetadataStorage';
import { UploadError } from '@/storage/uploadErrors';
import { canonicalStringify } from '@/utils/canonicalJson';
import { useCancellableAsync } from './cancellableAsync';
import { formatPublishErrorMessage } from './errors';
import {
  buildRegistrationPublishMetadata,
  createRegistrationPublishReadiness,
  getDraftVideoPosterBlockers,
  getReusableS3StorageUri,
  resolvePublishedMetadataPublicUrl,
  resolveRegistrationPublishAction,
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
import { createSlugCheckFromLookupResult } from './registrationDraftSlugCheck';
import { usePublishWalletBalances } from './usePublishWalletBalances';

export type RegistrationDraftPublishState =
  | {
      status: 'idle';
      action: null;
      errorMessage: null;
      metadataHash: string | null;
      metadataUri: string | null;
      metadataPublicUrl: string | null;
      stage: string;
      suiTransactionDigest: string | null;
    }
  | {
      status: 'publishing';
      action: RegistrationPublishAction | null;
      errorMessage: null;
      metadataHash: string | null;
      metadataUri: string | null;
      metadataPublicUrl: string | null;
      stage: string;
      suiTransactionDigest: string | null;
    }
  | {
      status: 'success';
      action: RegistrationPublishAction;
      errorMessage: null;
      metadataHash: string;
      metadataUri: string;
      metadataPublicUrl: string;
      stage: string;
      suiTransactionDigest: string;
    }
  | {
      status: 'error';
      action: RegistrationPublishAction | null;
      errorMessage: string;
      metadataHash: string | null;
      metadataUri: string | null;
      metadataPublicUrl: string | null;
      stage: string;
      suiTransactionDigest: string | null;
    };

export type RegistrationDraftPublishController = {
  publishReadiness: RegistrationPublishReadiness;
  publishState: RegistrationDraftPublishState;
  suiNetwork: string;
  walletAddress: string | null;
  walletBalanceStatus: PublishWalletBalanceUiState;
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

type LocalMediaDescriptor = Awaited<ReturnType<typeof readLocalMediaDescriptor>>;

const INITIAL_PUBLISH_STATE: RegistrationDraftPublishState = {
  status: 'idle',
  action: null,
  errorMessage: null,
  metadataHash: null,
  metadataUri: null,
  metadataPublicUrl: null,
  stage: 'Not started.',
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
  const publishTracker = useCancellableAsync();
  const [publishState, setPublishState] =
    useState<RegistrationDraftPublishState>(INITIAL_PUBLISH_STATE);
  const suiNetwork = viteSuiNetwork();
  const uploadApiBase = viteUploadApiBase() ?? null;
  const walletAddress = currentAccount?.address ?? null;
  const walletBalanceStatus = usePublishWalletBalances({
    draft,
    targetNetwork: suiNetwork,
    walletAddress,
    walletNetwork: walletAddress ? currentWalletNetwork : null,
  });
  const walletBalanceBlockers = useMemo(
    () => getPublishWalletBalanceBlockers(walletBalanceStatus),
    [walletBalanceStatus],
  );
  const publishReadiness = useMemo(() => {
    const readiness = createRegistrationPublishReadiness({
      registryConfigured: registryConfigured(),
      reviewReady: review.ready,
      suiNetwork,
      walletAddress,
      walletNetwork: walletAddress ? currentWalletNetwork : null,
      uploadApiBase,
      walletBalanceBlockers,
    });
    const mediaBlockers = getDraftVideoPosterBlockers(draft?.media ?? []);

    return {
      blockers: [...readiness.blockers, ...mediaBlockers],
      ready: readiness.ready && mediaBlockers.length === 0,
    };
  }, [
    currentWalletNetwork,
    draft?.media,
    review.ready,
    suiNetwork,
    uploadApiBase,
    walletAddress,
    walletBalanceBlockers,
  ]);

  const setPublishingStage = useCallback((stage: string) => {
    setPublishState((current) => ({
      status: 'publishing',
      action: current.action,
      errorMessage: null,
      metadataHash: current.metadataHash,
      metadataUri: current.metadataUri,
      metadataPublicUrl: current.metadataPublicUrl,
      stage,
      suiTransactionDigest: current.suiTransactionDigest,
    }));
  }, []);

  useEffect(() => () => publishTracker.cancel(), [publishTracker]);

  useEffect(() => {
    if (!draft || draft.status !== 'published') return;
    const publish = draft.publish;
    const metadataPublicUrl = publish
      ? resolvePublishedMetadataPublicUrl(publish)
      : null;
    if (
      !publish?.suiTransactionDigest ||
      !publish.metadataUri ||
      !publish.metadataHash ||
      !metadataPublicUrl
    ) {
      return;
    }

    setPublishState({
      status: 'success',
      action: publish.publishAction ?? 'register',
      errorMessage: null,
      metadataHash: publish.metadataHash,
      metadataUri: publish.metadataUri,
      metadataPublicUrl,
      stage: 'Published.',
      suiTransactionDigest: publish.suiTransactionDigest,
    });
  }, [draft]);

  const onPublish = useCallback(async () => {
    if (!draft || draft.status === 'published') return;
    if (publishState.status === 'publishing') return;
    const requestId = publishTracker.begin();

    if (!publishReadiness.ready) {
      setPublishState({
        status: 'error',
        action: null,
        errorMessage: publishReadiness.blockers.join(' '),
        metadataHash: null,
        metadataUri: null,
        metadataPublicUrl: null,
        stage: 'Blocked.',
        suiTransactionDigest: null,
      });
      return;
    }

    const packageId = vitePackageId();
    const registryId = viteRegistryId();
    if (!packageId || !registryId || !walletAddress || !uploadApiBase) return;

    setPublishState({
      status: 'publishing',
      action: null,
      errorMessage: null,
      metadataHash: null,
      metadataUri: null,
      metadataPublicUrl: null,
      stage: 'Saving draft.',
      suiTransactionDigest: null,
    });

    try {
      const savedDraft = await autosave.flush();
      if (!savedDraft) throw new Error('Draft not found.');

      const slugCheck = await checkPublishSlug(fields.slug, setPublishingStage);
      if (!publishTracker.isCurrent(requestId)) return;
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
        metadataPublicUrl: current.metadataPublicUrl,
        stage: current.stage,
        suiTransactionDigest: current.suiTransactionDigest,
      }));

      const baseMetadata = buildRegistrationDraftMetadata(fields);
      const mediaAssets = await createUploadedMediaAssets({
        address: walletAddress,
        apiBase: uploadApiBase,
        baseMetadata,
        draft: savedDraft,
        isCurrent: () => publishTracker.isCurrent(requestId),
        setStage: setPublishingStage,
        slug: fields.slug,
        storage,
      });
      if (!publishTracker.isCurrent(requestId)) return;
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
        address: walletAddress,
        apiBase: uploadApiBase,
        draft: savedDraft,
        metadata: publishMetadata.metadata,
        metadataHash,
        isCurrent: () => publishTracker.isCurrent(requestId),
        setStage: setPublishingStage,
        slug: fields.slug,
        storage,
      });
      if (!publishTracker.isCurrent(requestId)) return;
      const metadataUri = metadataUpload.uri;

      setPublishState((current) => ({
        status: 'publishing',
        action: current.action,
        errorMessage: null,
        metadataHash,
        metadataUri,
        metadataPublicUrl: metadataUpload.uri,
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
        slug: fields.slug,
        metadataUri,
        metadataHash: hexToBytes(metadataHash),
        categories: fields.categories,
      };
      const tx =
        publishAction.action === 'register'
          ? buildRegisterAppTransaction(txInput)
          : buildUpdateAppTransaction(txInput);

      const signer = new CurrentAccountSigner(dAppKit);
      const executed = await signer.signAndExecuteTransaction({
        transaction: tx,
      });
      const suiTransactionDigest = requireSuccessfulTxDigest(executed);

      const publishedDraft = await storage.finalizePublishedDraft(
        savedDraft.id,
        {
          metadataHash,
          metadataUri,
          storageUri: metadataUpload.uri,
          suiTransactionDigest,
          publishAction: publishAction.action,
        },
      );
      setDraft((currentDraft) =>
        currentDraft?.id === savedDraft.id ? publishedDraft : currentDraft,
      );
      if (!publishTracker.isCurrent(requestId)) return;
      setPublishState({
        status: 'success',
        action: publishAction.action,
        errorMessage: null,
        metadataHash,
        metadataUri,
        metadataPublicUrl: metadataUpload.uri,
        stage: 'Published.',
        suiTransactionDigest,
      });
    } catch (caughtError) {
      if (!publishTracker.isCurrent(requestId)) return;
      if (
        (caughtError instanceof UploadError && caughtError.code === 'cancelled') ||
        (caughtError instanceof Error &&
          caughtError.message === 'Publish canceled.')
      ) {
        return;
      }
      setPublishState((current) => ({
        status: 'error',
        action: current.action,
        errorMessage: formatPublishErrorMessage(caughtError, {
          fallback: 'Could not publish listing.',
        }),
        metadataHash: current.metadataHash,
        metadataUri: current.metadataUri,
        metadataPublicUrl: current.metadataPublicUrl,
        stage: 'Failed.',
        suiTransactionDigest: current.suiTransactionDigest,
      }));
    }
  }, [
    autosave,
    dAppKit,
    draft,
    fields,
    publishTracker,
    publishReadiness,
    publishState.status,
    setDraft,
    setPublishingStage,
    storage,
    uploadApiBase,
    walletAddress,
  ]);

  return {
    publishReadiness,
    publishState,
    suiNetwork,
    walletAddress,
    walletBalanceStatus,
    walletNetwork: walletAddress ? currentWalletNetwork : null,
    onConnectWallet: handleConnect,
    onPublish,
  };
}

async function checkPublishSlug(
  slug: string,
  setStage: PublishStageSetter,
): Promise<RegistrationDraftSlugCheckState> {
  const normalizedSlug = normalizeRegistrySlug(slug);
  setStage('Checking slug.');
  const result = await lookupRegistrySlug(normalizedSlug);
  return createSlugCheckFromLookupResult(normalizedSlug, result);
}

async function createUploadedMediaAssets({
  address,
  apiBase,
  baseMetadata,
  draft,
  isCurrent,
  setStage,
  slug,
  storage,
}: {
  address: string;
  apiBase: string;
  baseMetadata: RegistrationDraftMetadataJson;
  draft: Draft;
  isCurrent: () => boolean;
  setStage: PublishStageSetter;
  slug: string;
  storage: DraftStorage;
}): Promise<RegistrationPublishMediaAsset[]> {
  if (draft.media.length === 0) return [];

  setStage('Reading local media.');
  const descriptors = await Promise.all(
    draft.media.map((media) => readLocalMediaDescriptor(draft.id, media, storage)),
  );
  if (!isCurrent()) {
    throw new UploadError('cancelled', 'Publish canceled.');
  }
  const preflight = buildRegistrationPublishMetadata({
    baseMetadata,
    mediaAssets: descriptors.map((descriptor) => ({
      ...descriptor,
      storageUri: `https://preview.local/${descriptor.media.id}`,
    })),
  });
  if (!preflight.ready) {
    throw new Error(formatPublishIssueMessages(preflight.issues));
  }

  const checkpoints = [...(draft.publish?.media ?? [])];
  const assets: RegistrationPublishMediaAsset[] = [];
  for (const [index, descriptor] of descriptors.entries()) {
    if (!isCurrent()) {
      throw new UploadError('cancelled', 'Publish canceled.');
    }
    const checkpoint = findMatchingMediaCheckpoint(checkpoints, descriptor);
    const checkpointStorageUri = checkpoint
      ? getReusableS3StorageUri(checkpoint)
      : null;
    if (checkpointStorageUri) {
      assets.push({
        media: descriptor.media,
        storageUri: checkpointStorageUri,
        sha256: descriptor.sha256,
        sizeBytes: descriptor.sizeBytes,
        width: descriptor.width,
        height: descriptor.height,
        durationSeconds: descriptor.durationSeconds,
      });
      continue;
    }

    setStage(
      `Uploading media ${index + 1}/${descriptors.length}: ${descriptor.media.name}.`,
    );
    const bytes = new Uint8Array(await descriptor.content.arrayBuffer());
    const upload = await uploadMediaToS3({
      address,
      slug,
      filename: stableMediaFilename(
        descriptor.media.id,
        descriptor.media.mimeType,
      ),
      contentType: descriptor.media.mimeType,
      bytes,
      sha256: descriptor.sha256,
      apiBase,
    });
    const nextCheckpoint: DraftPublishedMediaCheckpoint = {
      mediaId: descriptor.media.id,
      storageUri: upload.uri,
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
      storageUri: upload.uri,
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
  address,
  apiBase,
  draft,
  metadata,
  metadataHash,
  isCurrent,
  setStage,
  slug,
  storage,
}: {
  address: string;
  apiBase: string;
  draft: Draft;
  metadata: RegistrationDraftMetadataJson;
  metadataHash: string;
  isCurrent: () => boolean;
  setStage: PublishStageSetter;
  slug: string;
  storage: DraftStorage;
}): Promise<{
  uri: string;
}> {
  const checkpointStorageUri = draft.publish
    ? getReusableS3StorageUri(draft.publish)
    : null;
  if (
    draft.publish?.metadataHash === metadataHash &&
    draft.publish.metadataUri &&
    checkpointStorageUri
  ) {
    return {
      uri: checkpointStorageUri,
    };
  }

  setStage('Uploading metadata.');
  const bytes = new TextEncoder().encode(canonicalStringify(metadata));
  const upload = await uploadManifestToS3({
    address,
    slug,
    bytes,
    sha256: metadataHash,
    apiBase,
  });
  if (!isCurrent()) {
    throw new UploadError('cancelled', 'Publish canceled.');
  }
  await storage.savePublishCheckpoint(draft.id, {
    metadataHash,
    metadataUri: upload.uri,
    storageUri: upload.uri,
  });

  return { uri: upload.uri };
}

function findMatchingMediaCheckpoint(
  checkpoints: DraftPublishedMediaCheckpoint[],
  descriptor: LocalMediaDescriptor,
): DraftPublishedMediaCheckpoint | null {
  return (
    checkpoints.find(
      (checkpoint) =>
        getReusableS3StorageUri(checkpoint) !== null &&
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
