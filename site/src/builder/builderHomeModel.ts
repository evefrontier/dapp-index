import type { Draft, DraftStep } from '@/storage/draftStorage';
import { getBuilderWizardStepLabel } from './builderWizardModel';

export type BuilderHomeDraftItem = {
  id: string;
  title: string;
  currentStep: DraftStep;
  currentStepLabel: string;
  updatedAtLabel: string;
};

export function createBuilderHomeDraftItem(
  draft: Draft,
): BuilderHomeDraftItem {
  return {
    id: draft.id,
    title: getDraftTitle(draft),
    currentStep: draft.currentStep,
    currentStepLabel: getBuilderWizardStepLabel(draft.currentStep),
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
