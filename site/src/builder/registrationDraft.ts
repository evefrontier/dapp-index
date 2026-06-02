import type { Draft } from '@/storage/draftStorage';

export type CreateRegistrationDraftOptions = {
  id?: string;
  now?: () => Date;
  randomUUID?: () => string;
};

export function createRegistrationDraft(
  options: CreateRegistrationDraftOptions = {},
): Draft {
  const now = options.now ?? (() => new Date());
  const timestamp = now().toISOString();

  return {
    id: options.id ?? createDraftId(options.randomUUID),
    status: 'draft',
    currentStep: 'profile',
    completedSteps: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    fields: {},
    media: [],
  };
}

function createDraftId(randomUUID?: () => string): string {
  if (randomUUID) return randomUUID();
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return `draft-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
