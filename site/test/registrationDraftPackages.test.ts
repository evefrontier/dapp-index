import { describe, expect, test } from 'bun:test';
import {
  createRegistrationDraftPackage,
  createRegistrationDraftPackagePatch,
  getRegistrationDraftPackageVerificationBlocker,
  readRegistrationDraftPackages,
  validateRegistrationDraftPackages,
} from '../src/builder/registrationDraftPackages';

const packageId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const packageInfoId =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('registration draft packages', () => {
  test('reads typed Sui package identities from generic draft fields', () => {
    expect(
      readRegistrationDraftPackages({
        suiPackages: [
          {
            draftPackageId: 'package-1',
            network: 'mainnet',
            role: 'core',
            mvrName: '@frontier/map',
            packageId,
            packageInfoId,
          },
          {
            draftPackageId: '',
            network: 'devnet',
            role: 'owner',
            mvrName: 123,
            packageId: null,
            packageInfoId: undefined,
          },
        ],
      }),
    ).toEqual([
      {
        draftPackageId: 'package-1',
        network: 'mainnet',
        role: 'core',
        mvrName: '@frontier/map',
        packageId,
        packageInfoId,
      },
      {
        draftPackageId: 'package-2',
        network: 'testnet',
        role: 'dependency',
        mvrName: '',
        packageId: '',
        packageInfoId: '',
      },
    ]);
  });

  test('creates new package rows with stable defaults', () => {
    expect(
      createRegistrationDraftPackage({
        draftPackageId: 'package-123',
        role: 'core',
      }),
    ).toEqual({
      draftPackageId: 'package-123',
      network: 'testnet',
      role: 'core',
      mvrName: '',
      packageId: '',
      packageInfoId: '',
    });

    expect(
      createRegistrationDraftPackage({
        draftPackageId: 'package-456',
        role: 'dependency',
      }).role,
    ).toBe('dependency');
  });

  test('creates a storage patch for draft Sui packages', () => {
    const packages = [
      createRegistrationDraftPackage({
        draftPackageId: 'package-1',
        role: 'core',
      }),
    ];

    expect(createRegistrationDraftPackagePatch(packages)).toEqual({
      suiPackages: packages,
    });
  });

  test('validates optional package identities', () => {
    expect(validateRegistrationDraftPackages([])).toEqual({
      fieldErrors: {},
      packageErrors: [],
    });

    const invalid = validateRegistrationDraftPackages([
      createRegistrationDraftPackage({
        draftPackageId: 'package-1',
        role: 'core',
      }),
    ]);

    expect(invalid.fieldErrors.suiPackages).toBe(
      'Add a valid package ID for each package.',
    );
    expect(invalid.packageErrors[0]).toMatchObject({
      packageId: 'Package ID is required.',
    });

    expect(
      validateRegistrationDraftPackages([
        {
          draftPackageId: 'package-1',
          network: 'mainnet',
          role: 'dependency',
          mvrName: '',
          packageId,
          packageInfoId: '',
        },
      ]),
    ).toEqual({ fieldErrors: {}, packageErrors: [{}] });

    expect(
      validateRegistrationDraftPackages([
        {
          draftPackageId: 'package-1',
          network: 'mainnet',
          role: 'dependency',
          mvrName: '@frontier/map',
          packageId,
          packageInfoId,
        },
      ]),
    ).toEqual({ fieldErrors: {}, packageErrors: [{}] });

    expect(
      validateRegistrationDraftPackages([
        {
          draftPackageId: 'package-1',
          network: 'mainnet',
          role: 'dependency',
          mvrName: 'frontier-map',
          packageId,
          packageInfoId: '0x123',
        },
      ]),
    ).toEqual({
      fieldErrors: {
        suiPackages: 'Fix optional MVR fields before verification.',
      },
      packageErrors: [
        {
          mvrName: 'Use a valid MVR name.',
          packageInfoId: 'Use a valid Sui object ID.',
        },
      ],
    });
  });

  test('requires MVR names only for package verification', () => {
    const packageIdOnly = {
      draftPackageId: 'package-1',
      network: 'mainnet' as const,
      role: 'dependency' as const,
      mvrName: '',
      packageId,
      packageInfoId: '',
    };

    expect(getRegistrationDraftPackageVerificationBlocker([])).toBe(
      'Add a package before verification.',
    );
    expect(
      getRegistrationDraftPackageVerificationBlocker([packageIdOnly]),
    ).toBe('Add MVR names to verify packages.');
    expect(
      getRegistrationDraftPackageVerificationBlocker([
        { ...packageIdOnly, mvrName: '@frontier/map' },
      ]),
    ).toBeNull();
  });
});
