import { useConnection } from '@evefrontier/dapp-kit';
import {
  CurrentAccountSigner,
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { hexToBytes } from '@/chain/bytes';
import { normalizeRegistrySlug } from '@/chain/normalizeRegistrySlug';
import {
  getPublishWalletBalanceBlockers,
  type PublishWalletBalanceUiState,
} from '@/chain/publishWalletBalances';
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
import { requireSuccessfulTxDigest } from '@/chain/txDigest';
import {
  createWalrusSuiClient,
  isWalrusChainNetwork,
  walrusBlobReadUrl,
  walrusBlobUri,
} from '@/chain/walrusClient';
import type {
  Draft,
  DraftPublishedMediaCheckpoint,
  DraftStorage,
} from '@/storage/draftStorage';
import { readLocalMediaDescriptor } from '@/storage/localMediaProbe';
import { canonicalStringify } from '@/utils/canonicalJson';
import { useCancellableAsync } from './cancellableAsync';
import { getErrorMessage } from './errors';
import {
  buildRegistrationPublishMetadata,
  createRegistrationPublishReadiness,
  getDraftVideoPosterBlockers,
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
  const walrusAggregatorUrl = viteWalrusAggregatorUrl() ?? null;
  const walletAddress = currentAccount?.address ?? null;
  const walletBalanceStatus = usePublishWalletBalances({
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
      walrusAggregatorUrl,
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
    walletAddress,
    walletBalanceBlockers,
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

  useEffect(() => () => publishTracker.cancel(), [publishTracker]);

  useEffect(() => {
    if (!draft || draft.status !== 'published') return;
    const publish = draft.publish;
    if (
      !publish?.suiTransactionDigest ||
      !publish.metadataUri ||
      !publish.metadataHash ||
      !publish.walrusUrl
    ) {
      return;
    }

    setPublishState({
      status: 'success',
      action: publish.publishAction ?? 'register',
      errorMessage: null,
      metadataHash: publish.metadataHash,
      metadataUri: publish.metadataUri,
      metadataWalrusUrl: publish.walrusUrl,
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
        metadataWalrusUrl: null,
        stage: 'Blocked.',
        suiTransactionDigest: null,
      });
      return;
    }

    const packageId = vitePackageId();
    const registryId = viteRegistryId();
    if (!packageId || !registryId || !walletAddress) return;
    if (!isWalrusChainNetwork(suiNetwork) || !walrusAggregatorUrl) return;

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
        metadataWalrusUrl: current.metadataWalrusUrl,
        stage: current.stage,
        suiTransactionDigest: current.suiTransactionDigest,
      }));

      const baseMetadata = buildRegistrationDraftMetadata(fields);
      const mediaAssets = await createUploadedMediaAssets({
        baseMetadata,
        draft: savedDraft,
        isCurrent: () => publishTracker.isCurrent(requestId),
        setStage: setPublishingStage,
        storage,
        uploadBlob,
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
        draft: savedDraft,
        metadata: publishMetadata.metadata,
        metadataHash,
        isCurrent: () => publishTracker.isCurrent(requestId),
        setStage: setPublishingStage,
        storage,
        uploadBlob,
      });
      if (!publishTracker.isCurrent(requestId)) return;
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
        slug: normalizeRegistrySlug(fields.slug),
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
      const suiTransactionDigest = requireSuccessfulTxDigest(txResult);

      const publishedDraft = await storage.finalizePublishedDraft(
        savedDraft.id,
        {
          metadataHash,
          metadataUri,
          suiTransactionDigest,
          walrusBlobId: metadataUpload.walrusBlobId,
          walrusUrl: metadataUpload.walrusUrl,
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
        metadataWalrusUrl: metadataUpload.walrusUrl,
        stage: 'Published.',
        suiTransactionDigest,
      });
    } catch (caughtError) {
      if (!publishTracker.isCurrent(requestId)) return;
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
    publishTracker,
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
  baseMetadata,
  draft,
  isCurrent,
  setStage,
  storage,
  uploadBlob,
}: {
  baseMetadata: RegistrationDraftMetadataJson;
  draft: Draft;
  isCurrent: () => boolean;
  setStage: PublishStageSetter;
  storage: DraftStorage;
  uploadBlob: WalrusUploader;
}): Promise<RegistrationPublishMediaAsset[]> {
  if (draft.media.length === 0) return [];

  setStage('Reading local media.');
  const descriptors = await Promise.all(
    draft.media.map((media) => readLocalMediaDescriptor(draft.id, media, storage)),
  );
  if (!isCurrent()) {
    throw new Error('Publish canceled.');
  }
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
    if (!isCurrent()) {
      throw new Error('Publish canceled.');
    }
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
  isCurrent,
  setStage,
  storage,
  uploadBlob,
}: {
  draft: Draft;
  metadata: RegistrationDraftMetadataJson;
  metadataHash: string;
  isCurrent: () => boolean;
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
  if (!isCurrent()) {
    throw new Error('Publish canceled.');
  }
  await storage.savePublishCheckpoint(draft.id, {
    metadataHash,
    metadataUri: walrusBlobUri(upload.walrusBlobId),
    walrusBlobId: upload.walrusBlobId,
    walrusUrl: upload.walrusUrl,
  });

  return upload;
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
