import { describe, expect, test } from 'bun:test';
import {
  createWizardStepItems,
  getWizardAdjacentStep,
  getWizardStatusLabel,
  getWizardStepLabel,
  isWizardPlaceholderStep,
  resolveWizardRouteStep,
} from '../src/builder/wizardModel';

describe('builder wizard model', () => {
  test('labels every builder listing step with short screen text', () => {
    expect(getWizardStepLabel('basics')).toBe('Basics');
    expect(getWizardStepLabel('about')).toBe('About');
    expect(getWizardStepLabel('packages')).toBe('Packages');
    expect(getWizardStepLabel('media')).toBe('Media');
    expect(getWizardStepLabel('publish')).toBe('Publish');
  });

  test('builds ordered progress items from active and completed steps', () => {
    const items = createWizardStepItems('packages', [
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
    expect(resolveWizardRouteStep('media', 'basics')).toEqual({
      step: 'media',
      shouldRedirect: false,
    });
    expect(resolveWizardRouteStep('bad-step', 'about')).toEqual({
      step: 'about',
      shouldRedirect: true,
    });
  });

  test('finds adjacent wizard steps without overflowing the wizard order', () => {
    expect(getWizardAdjacentStep('basics', 'previous')).toBeNull();
    expect(getWizardAdjacentStep('basics', 'next')).toBe('about');
    expect(getWizardAdjacentStep('packages', 'next')).toBe('media');
    expect(getWizardAdjacentStep('publish', 'next')).toBeNull();
  });

  test('maps autosave states to short status labels', () => {
    expect(getWizardStatusLabel('idle')).toBe('Saved');
    expect(getWizardStatusLabel('pending')).toBe('Unsaved');
    expect(getWizardStatusLabel('saving')).toBe('Saving');
    expect(getWizardStatusLabel('saved')).toBe('Saved');
    expect(getWizardStatusLabel('error')).toBe('Save failed');
  });

  test('keeps only future publish screens as placeholders', () => {
    expect(isWizardPlaceholderStep('media')).toBe(false);
    expect(isWizardPlaceholderStep('review')).toBe(true);
    expect(isWizardPlaceholderStep('publish')).toBe(true);
  });
});
