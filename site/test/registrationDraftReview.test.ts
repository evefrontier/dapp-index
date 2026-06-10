import { describe, expect, test } from 'bun:test';
import {
  buildRegistrationDraftMetadata,
  createRegistrationDraftReview,
  createRegistrationMetadataHashHex,
  getReviewNextBlockerMessage,
  INITIAL_REGISTRATION_DRAFT_SLUG_CHECK,
  isReviewSlugCheckReady,
} from '../src/builder/registrationDraftReview';
import type { RegistrationDraftFields } from '../src/builder/registrationDraftFields';

const packageId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const packageInfoId =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const validFields: RegistrationDraftFields = {
  name: ' Frontier Map ',
  slug: 'frontier-map',
  summary: ' Maps routes and gate networks. ',
  description: ' A route planning dapp. ',
  liveUrl: 'https://frontier-map.example',
  repositoryUrl: 'https://github.com/example/frontier-map',
  documentationUrl: 'https://docs.frontier-map.example',
  categories: ['logistics', 'intel'],
  smartAssemblyTypes: ['gate'],
  serverTenant: 'stillness',
  suiPackages: [
    {
      draftPackageId: 'package-1',
      network: 'testnet',
      role: 'core',
      mvrName: '@frontier/map',
      packageId,
      packageInfoId,
    },
  ],
};

describe('registration draft review', () => {
  test('builds registry metadata JSON from draft fields', () => {
    expect(buildRegistrationDraftMetadata(validFields)).toEqual({
      schema: 'evefrontier.dapp-index.metadata',
      schemaVersion: 1,
      id: 'frontier-map',
      name: 'Frontier Map',
      summary: 'Maps routes and gate networks.',
      description: 'A route planning dapp.',
      categories: ['logistics', 'intel'],
      smartAssemblyTypes: ['gate'],
      liveUrl: 'https://frontier-map.example',
      repositoryUrl: 'https://github.com/example/frontier-map',
      documentationUrl: 'https://docs.frontier-map.example',
      suiPackages: [
        {
          network: 'testnet',
          role: 'core',
          mvrName: '@frontier/map',
          packageId,
          packageInfoId,
        },
      ],
      serverTenant: 'stillness',
    });
  });

  test('warns when package rows are missing optional identity fields', () => {
    const review = createRegistrationDraftReview({
      ...validFields,
      suiPackages: [
        {
          ...validFields.suiPackages[0],
          role: 'dependency',
          mvrName: '',
          packageInfoId: '',
        },
      ],
    });

    expect(review.ready).toBe(true);
    expect(review.schemaValidation.ok).toBe(true);
    expect(review.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining([
        'suiPackages.mvrName',
        'suiPackages.packageInfoId',
      ]),
    );
    expect(review.issues.every((issue) => issue.severity === 'warning')).toBe(
      true,
    );
  });

  test('treats missing package rows as optional', () => {
    const review = createRegistrationDraftReview({
      ...validFields,
      suiPackages: [],
    });

    expect(review.ready).toBe(true);
    expect(review.schemaValidation.ok).toBe(true);
    expect(review.metadata).not.toHaveProperty('suiPackages');
    expect(review.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'optional.suiPackages',
          severity: 'warning',
        }),
      ]),
    );
  });

  test('marks complete metadata as ready and schema valid', () => {
    const review = createRegistrationDraftReview(validFields);

    expect(review.ready).toBe(true);
    expect(review.schemaValidation.ok).toBe(true);
    expect(review.issues).toEqual([]);
    expect(review.canonicalJson).toBe(
      '{"categories":["logistics","intel"],"description":"A route planning dapp.","documentationUrl":"https://docs.frontier-map.example","id":"frontier-map","liveUrl":"https://frontier-map.example","name":"Frontier Map","repositoryUrl":"https://github.com/example/frontier-map","schema":"evefrontier.dapp-index.metadata","schemaVersion":1,"serverTenant":"stillness","smartAssemblyTypes":["gate"],"suiPackages":[{"mvrName":"@frontier/map","network":"testnet","packageId":"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","packageInfoId":"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","role":"core"}],"summary":"Maps routes and gate networks."}',
    );
  });

  test('keeps optional missing fields as non-blocking warnings', () => {
    const review = createRegistrationDraftReview({
      ...validFields,
      description: '',
      repositoryUrl: '',
      documentationUrl: '',
      smartAssemblyTypes: [],
    });

    expect(review.ready).toBe(true);
    expect(review.schemaValidation.ok).toBe(true);
    expect(review.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'optional.description',
          severity: 'warning',
        }),
        expect.objectContaining({
          id: 'optional.repositoryUrl',
          severity: 'warning',
        }),
        expect.objectContaining({
          id: 'optional.documentationUrl',
          severity: 'warning',
        }),
      ]),
    );
    expect(review.issues.every((issue) => issue.severity === 'warning')).toBe(
      true,
    );
  });

  test('creates a stable canonical SHA-256 hash preview', async () => {
    const metadata = buildRegistrationDraftMetadata(validFields);
    const reorderedMetadata = {
      summary: metadata.summary,
      name: metadata.name,
      schemaVersion: metadata.schemaVersion,
      schema: metadata.schema,
      id: metadata.id,
      categories: metadata.categories,
      suiPackages: metadata.suiPackages,
      liveUrl: metadata.liveUrl,
      serverTenant: metadata.serverTenant,
      smartAssemblyTypes: metadata.smartAssemblyTypes,
      repositoryUrl: metadata.repositoryUrl,
      documentationUrl: metadata.documentationUrl,
      description: metadata.description,
    };

    await expect(createRegistrationMetadataHashHex(metadata)).resolves.toBe(
      await createRegistrationMetadataHashHex(reorderedMetadata),
    );
    await expect(createRegistrationMetadataHashHex(metadata)).resolves.toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  test('treats warnings as ready for review navigation', () => {
    const review = createRegistrationDraftReview({
      ...validFields,
      description: '',
      repositoryUrl: '',
      documentationUrl: '',
      smartAssemblyTypes: [],
    });

    expect(review.ready).toBe(true);
    expect(
      getReviewNextBlockerMessage(review, INITIAL_REGISTRATION_DRAFT_SLUG_CHECK),
    ).toBe('Waiting for slug availability check.');
    expect(
      getReviewNextBlockerMessage(review, {
        status: 'available',
        checkedSlug: 'frontier-map',
        message: 'Slug is available.',
      }),
    ).toBeNull();
  });

  test('reports slug and blocker reasons for review navigation', () => {
    const review = createRegistrationDraftReview(validFields);

    expect(
      isReviewSlugCheckReady({
        status: 'unconfigured',
        message: 'Registry not configured — slug check skipped for local dev.',
      }),
    ).toBe(true);
    expect(
      getReviewNextBlockerMessage(review, {
        status: 'taken',
        checkedSlug: 'frontier-map',
        owner: packageId,
        message: 'Slug taken — change it on Basics and re-check.',
      }),
    ).toBe('Slug taken — change it on Basics and re-check.');
    expect(
      getReviewNextBlockerMessage(
        createRegistrationDraftReview({
          ...validFields,
          name: '',
        }),
        {
          status: 'available',
          checkedSlug: 'frontier-map',
          message: 'Slug is available.',
        },
      ),
    ).toBe('Fix 2 required issues to continue.');
  });
});
