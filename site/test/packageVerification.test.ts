import { describe, expect, test } from 'bun:test';
import {
  getPackageMvrMatchStatusLine,
  getMoveRegistryVerificationMessage,
} from '../src/builder/PackageVerification';
import {
  createRegistrationDraftPackage,
  getPackagesStepNotices,
} from '../src/builder/registrationDraftPackages';
import type {
  MoveRegistryResolvablePackage,
  MoveRegistryVerificationResult,
  MoveRegistryVerificationStatus,
} from '../src/chain/moveRegistry.types';

const packageId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const packageInfoId =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const entry: MoveRegistryResolvablePackage = {
  network: 'mainnet',
  role: 'core',
  mvrName: '@frontier/map',
  packageId,
  packageInfoId,
};

function result(
  status: MoveRegistryVerificationStatus,
  overrides: Partial<MoveRegistryVerificationResult> = {},
): MoveRegistryVerificationResult {
  return { status, entry, ...overrides };
}

describe('getMoveRegistryVerificationMessage', () => {
  test('surfaces the resolved package ID for a package mismatch', () => {
    const message = getMoveRegistryVerificationMessage(
      result('mismatch', {
        reason: 'resolved-package-id-mismatch',
        resolvedPackageId: packageId,
      }),
    );

    expect(message).toContain('different package ID');
    expect(message).toContain('0xaaaa…aaaa');
    expect(message).toContain('moveregistry.com');
  });

  test('falls back to a generic mismatch message without a resolved ID', () => {
    expect(
      getMoveRegistryVerificationMessage(
        result('mismatch', { reason: 'resolved-package-id-mismatch' }),
      ),
    ).toBe(
      'MVR resolves to a different package ID. Check the name on moveregistry.com or update your package ID.',
    );
  });

  test('names both networks for a network mismatch', () => {
    expect(
      getMoveRegistryVerificationMessage(
        result('mismatch', {
          reason: 'resolved-network-mismatch',
          network: 'mainnet',
          resolvedNetwork: 'testnet',
        }),
      ),
    ).toBe('MVR registers this name on testnet, not mainnet.');
  });

  test('maps known reason codes to readable copy', () => {
    expect(
      getMoveRegistryVerificationMessage(
        result('missing', { reason: 'invalid-mvr-name' }),
      ),
    ).toBe('MVR name is not valid. Use the format @suins/pkg or name.sui/pkg.');

    expect(
      getMoveRegistryVerificationMessage(
        result('unreachable', { reason: 'missing-mvr-resolver' }),
      ),
    ).toBe('Could not reach the Move Registry resolver. Try again.');
  });

  test('prefers an explicit error message over the fallback', () => {
    expect(
      getMoveRegistryVerificationMessage(
        result('unreachable', { errorMessage: 'Network request failed' }),
      ),
    ).toBe('Network request failed');
  });

  test('uses a generic fallback when nothing else is available', () => {
    expect(getMoveRegistryVerificationMessage(result('unreachable'))).toBe(
      'Could not check this package against MVR.',
    );
  });
});

describe('getPackageMvrMatchStatusLine', () => {
  test('describes optional packages when none are listed', () => {
    expect(
      getPackageMvrMatchStatusLine({
        packageCount: 0,
        verificationBlocker: null,
        verification: {
          status: 'idle',
          result: null,
          errorMessage: null,
        },
      }),
    ).toBe('Packages are optional for dapps without Move code.');
  });

  test('returns a single idle status line', () => {
    expect(
      getPackageMvrMatchStatusLine({
        packageCount: 1,
        verificationBlocker: null,
        verification: {
          status: 'idle',
          result: null,
          errorMessage: null,
        },
      }),
    ).toBe('Not checked yet.');
  });

  test('surfaces blockers in the status line', () => {
    expect(
      getPackageMvrMatchStatusLine({
        packageCount: 1,
        verificationBlocker: 'Add MVR names above to check.',
        verification: {
          status: 'idle',
          result: null,
          errorMessage: null,
        },
      }),
    ).toBe('Add MVR names above to check.');
  });
});

describe('getPackagesStepNotices', () => {
  const corePackage = createRegistrationDraftPackage({
    draftPackageId: 'package-1',
    role: 'core',
  });
  const dependencyPackage = createRegistrationDraftPackage({
    draftPackageId: 'package-2',
    role: 'dependency',
  });

  test('returns no notices when there are no packages', () => {
    expect(getPackagesStepNotices([])).toEqual([]);
  });

  test('returns no notices when a core package is listed', () => {
    expect(getPackagesStepNotices([corePackage])).toEqual([]);
  });

  test('nudges to add a core package when none is marked core', () => {
    expect(getPackagesStepNotices([dependencyPackage])).toEqual([
      'Mark your primary app package as core before publish.',
    ]);
  });
});
