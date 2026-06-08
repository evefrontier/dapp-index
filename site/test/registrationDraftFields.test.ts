import { describe, expect, test } from 'bun:test';
import {
  createRegistrationDraftFieldPatch,
  createRegistrationDraftFields,
  isRegistrationDraftFieldStep,
  isRegistrationDraftStepValid,
  readRegistrationDraftFields,
  validateRegistrationDraftFields,
} from '../src/builder/registrationDraftFields';

describe('registration draft fields', () => {
  const packageId =
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const packageInfoId =
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  test('reads typed registration fields from generic draft storage values', () => {
    expect(
      readRegistrationDraftFields({
        name: 'Frontier Map',
        slug: 'frontier-map',
        summary: 'Maps routes and gate networks.',
        description: 'A route planning dapp.',
        liveUrl: 'https://frontier-map.example',
        repositoryUrl: 'https://github.com/example/frontier-map',
        documentationUrl: 'https://docs.frontier-map.example',
        categories: ['logistics', 'bad-category', 'logistics', 'intel'],
        smartAssemblyTypes: ['gate', 'not-real', 'storage-unit'],
        serverTenant: 'stillness',
        suiPackages: [
          {
            draftPackageId: 'package-1',
            network: 'mainnet',
            role: 'core',
            mvrName: '@frontier/map',
            packageId,
            packageInfoId,
          },
        ],
      }),
    ).toEqual({
      name: 'Frontier Map',
      slug: 'frontier-map',
      summary: 'Maps routes and gate networks.',
      description: 'A route planning dapp.',
      liveUrl: 'https://frontier-map.example',
      repositoryUrl: 'https://github.com/example/frontier-map',
      documentationUrl: 'https://docs.frontier-map.example',
      categories: ['logistics', 'intel'],
      smartAssemblyTypes: ['gate', 'storage-unit'],
      serverTenant: 'stillness',
      suiPackages: [
        {
          draftPackageId: 'package-1',
          network: 'mainnet',
          role: 'core',
          mvrName: '@frontier/map',
          packageId,
          packageInfoId,
        },
      ],
    });
  });

  test('creates a storage patch with only registration field keys', () => {
    expect(
      createRegistrationDraftFieldPatch({
        ...createRegistrationDraftFields(),
        name: 'Frontier Map',
        slug: 'frontier-map',
        categories: ['logistics'],
      }),
    ).toEqual({
      name: 'Frontier Map',
      slug: 'frontier-map',
      summary: '',
      description: '',
      liveUrl: '',
      repositoryUrl: '',
      documentationUrl: '',
      categories: ['logistics'],
      smartAssemblyTypes: [],
      serverTenant: '',
      suiPackages: [],
    });
  });

  test('validates field-level requirements for the core metadata screens', () => {
    const errors = validateRegistrationDraftFields({
      ...createRegistrationDraftFields(),
      name: '',
      slug: 'Bad Slug',
      summary: '',
      liveUrl: 'http://frontier-map.example',
      repositoryUrl: 'not-a-url',
      documentationUrl: 'https://',
      categories: [],
      serverTenant: '',
    });

    expect(errors.name).toBe('Name is required.');
    expect(errors.slug).toBe('Use lowercase letters, numbers, and hyphens.');
    expect(errors.summary).toBe('Summary is required.');
    expect(errors.liveUrl).toBe('Use an HTTPS URL.');
    expect(errors.repositoryUrl).toBe('Use an HTTPS URL.');
    expect(errors.documentationUrl).toBe('Use an HTTPS URL.');
    expect(errors.categories).toBe('Choose at least one category.');
    expect(errors.serverTenant).toBe('Choose a server tenant.');
  });

  test('reports validity per wizard step', () => {
    const validFields = {
      ...createRegistrationDraftFields(),
      name: 'Frontier Map',
      slug: 'frontier-map',
      summary: 'Maps routes and gate networks.',
      liveUrl: 'https://frontier-map.example',
      categories: ['logistics'],
      serverTenant: 'stillness',
      suiPackages: [
        {
          draftPackageId: 'package-1',
          network: 'mainnet',
          role: 'core',
          mvrName: '@frontier/map',
          packageId,
          packageInfoId,
        },
      ],
    };

    expect(isRegistrationDraftStepValid('basics', validFields)).toBe(true);
    expect(isRegistrationDraftStepValid('about', validFields)).toBe(true);
    expect(isRegistrationDraftStepValid('discovery', validFields)).toBe(true);
    expect(isRegistrationDraftStepValid('packages', validFields)).toBe(true);

    expect(
      isRegistrationDraftStepValid('basics', {
        ...validFields,
        slug: 'Bad Slug',
      }),
    ).toBe(false);
    expect(
      isRegistrationDraftStepValid('about', {
        ...validFields,
        liveUrl: '',
      }),
    ).toBe(false);
    expect(
      isRegistrationDraftStepValid('discovery', {
        ...validFields,
        categories: [],
      }),
    ).toBe(false);
    expect(
      isRegistrationDraftStepValid('packages', {
        ...validFields,
        suiPackages: [],
      }),
    ).toBe(true);
    expect(
      isRegistrationDraftStepValid('media', validFields, [
        {
          id: 'hero-shot',
          kind: 'screenshot',
          role: 'gallery',
          name: 'Hero.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
        },
      ]),
    ).toBe(true);
    expect(
      isRegistrationDraftStepValid('media', validFields, [
        {
          id: 'hero-shot',
          kind: 'screenshot',
          role: 'gallery',
          name: 'Hero.png',
          mimeType: 'image/png',
          size: 1024,
          createdAt: '2026-05-19T09:00:00.000Z',
          alt: 'a'.repeat(241),
        },
      ]),
    ).toBe(false);
  });

  test('identifies wizard steps backed by registration fields', () => {
    expect(isRegistrationDraftFieldStep('basics')).toBe(true);
    expect(isRegistrationDraftFieldStep('about')).toBe(true);
    expect(isRegistrationDraftFieldStep('discovery')).toBe(true);
    expect(isRegistrationDraftFieldStep('packages')).toBe(true);
    expect(isRegistrationDraftFieldStep('media')).toBe(false);
    expect(isRegistrationDraftFieldStep('review')).toBe(false);
    expect(isRegistrationDraftFieldStep('publish')).toBe(false);
  });
});
