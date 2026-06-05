import { describe, expect, test } from 'bun:test';
import {
  createBuilderWizardStepItems,
  getBuilderWizardAdjacentStep,
  getBuilderWizardStatusLabel,
  getBuilderWizardStepLabel,
  isBuilderWizardPlaceholderStep,
  resolveBuilderWizardRouteStep,
} from '../src/builder/builderWizardModel';

describe('builder wizard model', () => {
  test('labels every builder listing step with short screen text', () => {
    expect(getBuilderWizardStepLabel('basics')).toBe('Basics');
    expect(getBuilderWizardStepLabel('about')).toBe('About');
    expect(getBuilderWizardStepLabel('packages')).toBe('Packages');
    expect(getBuilderWizardStepLabel('media')).toBe('Media');
    expect(getBuilderWizardStepLabel('publish')).toBe('Publish');
  });

  test('builds ordered progress items from active and completed steps', () => {
    const items = createBuilderWizardStepItems('packages', [
      'basics',
      'about',
      'about',
    ]);

    expect(items.map((item) => item.step)).toEqual([
      'basics',
      'about',
      'discovery',
      'packages',
      'media',
      'review',
      'publish',
    ]);
    expect(items[0]).toMatchObject({
      step: 'basics',
      label: 'Basics',
      state: 'complete',
    });
    expect(items[2]).toMatchObject({
      step: 'discovery',
      state: 'available',
    });
    expect(items[3]).toMatchObject({
      step: 'packages',
      state: 'active',
    });
  });

  test('resolves invalid route steps back to the stored draft step', () => {
    expect(resolveBuilderWizardRouteStep('media', 'basics')).toEqual({
      step: 'media',
      shouldRedirect: false,
    });
    expect(resolveBuilderWizardRouteStep('bad-step', 'about')).toEqual({
      step: 'about',
      shouldRedirect: true,
    });
  });

  test('finds adjacent wizard steps without overflowing the wizard order', () => {
    expect(getBuilderWizardAdjacentStep('basics', 'previous')).toBeNull();
    expect(getBuilderWizardAdjacentStep('basics', 'next')).toBe('about');
    expect(getBuilderWizardAdjacentStep('packages', 'next')).toBe('media');
    expect(getBuilderWizardAdjacentStep('publish', 'next')).toBeNull();
  });

  test('maps autosave states to short status labels', () => {
    expect(getBuilderWizardStatusLabel('idle')).toBe('Saved');
    expect(getBuilderWizardStatusLabel('pending')).toBe('Unsaved');
    expect(getBuilderWizardStatusLabel('saving')).toBe('Saving');
    expect(getBuilderWizardStatusLabel('saved')).toBe('Saved');
    expect(getBuilderWizardStatusLabel('error')).toBe('Save failed');
  });

  test('keeps only future publish screens as placeholders', () => {
    expect(isBuilderWizardPlaceholderStep('media')).toBe(false);
    expect(isBuilderWizardPlaceholderStep('review')).toBe(true);
    expect(isBuilderWizardPlaceholderStep('publish')).toBe(true);
  });
});
