import type { DappIndexMediaRole } from '@/types/dapp-index';

export const DRAFT_STORAGE_KEY = 'dapp-index:drafts:v1';

export const DRAFT_STEPS = [
  'basics',
  'about',
  'discovery',
  'packages',
  'media',
  'review',
  'publish',
] as const;

export type DraftStatus = 'draft' | 'ready-to-publish' | 'published';

export type DraftStep = (typeof DRAFT_STEPS)[number];

export const DEFAULT_DRAFT_STEP: DraftStep = 'basics';

const DRAFT_STEP_VALUES: ReadonlySet<string> = new Set(DRAFT_STEPS);

export function isDraftStep(value: unknown): value is DraftStep {
  return typeof value === 'string' && DRAFT_STEP_VALUES.has(value);
}

export function parseDraftStep(value: unknown): DraftStep | null {
  return isDraftStep(value) ? value : null;
}

export type DraftMediaKind = 'screenshot' | 'video';

export type DraftMedia = {
  id: string;
  kind: DraftMediaKind;
  role: DappIndexMediaRole;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  alt?: string;
  caption?: string;
  walrusBlobId?: string;
  walrusUrl?: string;
};

export type DraftPublishedMediaCheckpoint = {
  mediaId: string;
  walrusBlobId: string;
  walrusUrl: string;
  sha256: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSeconds?: number;
};

export type DraftPublishCheckpoint = {
  media?: DraftPublishedMediaCheckpoint[];
  metadataUri?: `walrus://blob/${string}`;
  walrusBlobId?: string;
  walrusUrl?: string;
  metadataHash?: string;
  suiTransactionDigest?: string;
  publishAction?: 'register' | 'update';
};

export type Draft = {
  id: string;
  status: DraftStatus;
  currentStep: DraftStep;
  completedSteps: DraftStep[];
  publish?: DraftPublishCheckpoint;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, unknown>;
  media: DraftMedia[];
};

export type DraftMediaInput = {
  id: string;
  kind: DraftMediaKind;
  role?: DappIndexMediaRole;
  name: string;
  mimeType?: string;
  alt?: string;
  caption?: string;
};

export type DraftMediaUpdate = {
  role?: DappIndexMediaRole;
  alt?: string;
  caption?: string;
};

export type DraftMediaValidation =
  | { ok: true }
  | { ok: false; reason: string };

export type DraftLocalMediaStore = {
  put(input: {
    draftId: string;
    mediaId: string;
    content: Blob;
  }): Promise<void>;
  get(draftId: string, mediaId: string): Promise<Blob | null>;
  delete(draftId: string, mediaId: string): Promise<void>;
  deleteDraft(draftId: string): Promise<void>;
  clear(): Promise<void>;
};

export type DraftStorageOptions = {
  localStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  localMediaStore?: DraftLocalMediaStore;
  now?: () => Date;
};

export type DraftStorage = {
  saveDraft(draft: Draft): Promise<Draft>;
  getDraft(draftId: string): Promise<Draft | null>;
  listDrafts(): Promise<Draft[]>;
  updateDraftFields(
    draftId: string,
    fields: Record<string, unknown>,
  ): Promise<Draft>;
  setDraftStep(
    draftId: string,
    currentStep: DraftStep,
  ): Promise<Draft>;
  completeDraftStep(
    draftId: string,
    completedStep: DraftStep,
    nextStep?: DraftStep,
  ): Promise<Draft>;
  savePublishCheckpoint(
    draftId: string,
    checkpoint: DraftPublishCheckpoint,
  ): Promise<Draft>;
  finalizePublishedDraft(
    draftId: string,
    checkpoint: DraftPublishCheckpoint,
  ): Promise<Draft>;
  saveMedia(
    draftId: string,
    media: DraftMediaInput,
    content: Blob,
  ): Promise<DraftMedia>;
  updateMedia(
    draftId: string,
    mediaId: string,
    media: DraftMediaUpdate,
  ): Promise<Draft>;
  deleteMedia(draftId: string, mediaId: string): Promise<Draft>;
  getLocalMedia(draftId: string, mediaId: string): Promise<Blob | null>;
  deleteDraft(draftId: string): Promise<void>;
  clearPublishedDraft(draftId: string): Promise<void>;
  clearDrafts(): Promise<void>;
};
