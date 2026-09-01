import type { Draft, DraftStep } from '@/storage/draftStorage';
import { isPublishedDraft } from './publishedDraft';
import { getWizardStepLabel } from './wizardModel';

export type HomeDraftItem = {
  id: string;
  title: string;
  currentStep: DraftStep;
  currentStepLabel: string;
  isPublished: boolean;
  statusLabel: string;
  updatedAtLabel: string;
};

export function createHomeDraftItem(
  draft: Draft,
): HomeDraftItem {
  const published = isPublishedDraft(draft);

  return {
    id: draft.id,
    title: getDraftTitle(draft),
    currentStep: draft.currentStep,
    currentStepLabel: getWizardStepLabel(draft.currentStep),
    isPublished: published,
    statusLabel: published
      ? 'Published'
      : `Step: ${getWizardStepLabel(draft.currentStep)}`,
    updatedAtLabel: formatDraftDate(draft.updatedAt),
  };
}

function getDraftTitle(draft: Draft): string {
  const name = draft.fields.name;
  const slug = draft.fields.slug ?? draft.fields.id;
  if (typeof name === 'string' && name.trim()) return name.trim();
  if (typeof slug === 'string' && slug.trim()) return slug.trim();
  return 'Untitled draft';
}

function formatDraftDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}
