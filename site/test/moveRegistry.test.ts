import { describe, expect, test } from 'bun:test';
import {
  verifyMoveRegistryPackage,
  verifyMoveRegistryPackagesForRelease,
  type MoveRegistryResolvablePackage,
  type MoveRegistryResolver,
} from '../src/chain/moveRegistry';

const packageId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function resolver(resolvedPackageId: string): MoveRegistryResolver {
  return {
    core: {
      mvr: {
        resolvePackage: async () => ({ package: resolvedPackageId }),
      },
    },
  };
}

const corePackage: MoveRegistryResolvablePackage = {
  network: 'mainnet',
  role: 'core',
  mvrName: '@frontier/map',
  packageId,
  packageInfoId:
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
};

describe('Move Registry package verification', () => {
  test('marks a package verified when MVR resolves to the declared package ID', async () => {
    const result = await verifyMoveRegistryPackage(
      corePackage,
      resolver(packageId.toUpperCase()),
    );

    expect(result.status).toBe('verified');
    expect(result.resolvedPackageId).toBe(packageId);
  });

  test('marks a package mismatched when MVR resolves a different package ID', async () => {
    const result = await verifyMoveRegistryPackage(
      corePackage,
      resolver('0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'),
    );

    expect(result.status).toBe('mismatch');
    expect(result.resolvedPackageId).toBe(
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    );
  });

  test('marks a package missing when the MVR name is absent or malformed', async () => {
    const missingName = await verifyMoveRegistryPackage(
      { ...corePackage, mvrName: '' },
      resolver(packageId),
    );
    const malformedName = await verifyMoveRegistryPackage(
      { ...corePackage, mvrName: 'frontier-map' },
      resolver(packageId),
    );

    expect(missingName.status).toBe('missing');
    expect(malformedName.status).toBe('missing');
  });

  test('marks a package unreachable when MVR resolution throws', async () => {
    const result = await verifyMoveRegistryPackage(corePackage, {
      core: {
        mvr: {
          resolvePackage: async () => {
            throw new Error('MVR unavailable');
          },
        },
      },
    });

    expect(result.status).toBe('unreachable');
    expect(result.errorMessage).toBe('MVR unavailable');
  });

  test('requires every package to verify and at least one core package for release', async () => {
    const good = await verifyMoveRegistryPackagesForRelease(
      [corePackage],
      resolver(packageId),
    );
    const noCore = await verifyMoveRegistryPackagesForRelease(
      [{ ...corePackage, role: 'dependency' }],
      resolver(packageId),
    );
    const mismatch = await verifyMoveRegistryPackagesForRelease(
      [corePackage],
      resolver('0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'),
    );

    expect(good.ok).toBe(true);
    expect(noCore.ok).toBe(false);
    expect(mismatch.ok).toBe(false);
  });
});
