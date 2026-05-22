import { describe, expect, test } from 'bun:test';
import {
  verifyMoveRegistryPackage,
  verifyMoveRegistryPackagesForRelease,
} from '../src/chain/moveRegistry';
import type {
  MoveRegistryPackageResolver,
  MoveRegistryResolvablePackage,
  MoveRegistryResolver,
} from '../src/chain/moveRegistry.types';

const packageId =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const packageInfoId =
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function resolver(options: {
  packageId?: string;
  packageInfoId?: string;
  network?: 'mainnet' | 'testnet';
} = {}): MoveRegistryResolver {
  return {
    core: {
      mvr: {
        resolvePackage: async () => ({
          package: options.packageId ?? packageId,
          packageInfoId: options.packageInfoId ?? packageInfoId,
          network: options.network,
        }),
      },
    },
  };
}

const corePackage: MoveRegistryResolvablePackage = {
  network: 'mainnet',
  role: 'core',
  mvrName: '@frontier/map',
  packageId,
  packageInfoId,
};

describe('Move Registry package verification', () => {
  test('marks a package verified when MVR resolves to the declared package and PackageInfo IDs', async () => {
    const result = await verifyMoveRegistryPackage(
      corePackage,
      resolver({ packageId: `0x${packageId.slice(2).toUpperCase()}` }),
    );

    expect(result.status).toBe('verified');
    expect(result.resolvedPackageId).toBe(packageId);
    expect(result.resolvedPackageInfoId).toBe(packageInfoId);
  });

  test('marks a package mismatched when MVR resolves a different package ID', async () => {
    const result = await verifyMoveRegistryPackage(
      corePackage,
      resolver({
        packageId:
          '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      }),
    );

    expect(result.status).toBe('mismatch');
    expect(result.reason).toBe('resolved-package-id-mismatch');
    expect(result.resolvedPackageId).toBe(
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    );
  });

  test('marks a package mismatched when MVR resolves a different PackageInfo ID', async () => {
    const result = await verifyMoveRegistryPackage(
      corePackage,
      resolver({
        packageInfoId:
          '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      }),
    );

    expect(result.status).toBe('mismatch');
    expect(result.reason).toBe('resolved-package-info-id-mismatch');
  });

  test('marks a package mismatched when MVR resolves on a different network', async () => {
    const result = await verifyMoveRegistryPackage(
      corePackage,
      resolver({ network: 'testnet' }),
    );

    expect(result.status).toBe('mismatch');
    expect(result.reason).toBe('resolved-network-mismatch');
  });

  test('marks a package missing when required identity fields are absent or malformed', async () => {
    const missingName = await verifyMoveRegistryPackage(
      { ...corePackage, mvrName: '' },
      resolver(),
    );
    const malformedName = await verifyMoveRegistryPackage(
      { ...corePackage, mvrName: 'frontier-map' },
      resolver(),
    );
    const malformedPackageInfoId = await verifyMoveRegistryPackage(
      { ...corePackage, packageInfoId: '0x123' },
      resolver(),
    );
    const missingPackageInfoId = await verifyMoveRegistryPackage(
      { ...corePackage, packageInfoId: undefined },
      resolver(),
    );

    expect(missingName.status).toBe('missing');
    expect(malformedName.status).toBe('missing');
    expect(malformedPackageInfoId.status).toBe('missing');
    expect(malformedPackageInfoId.reason).toBe('invalid-package-info-id');
    expect(missingPackageInfoId.reason).toBe('missing-package-info-id');
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

  test('marks a package unreachable with a reason when no MVR resolver is declared', async () => {
    const result = await verifyMoveRegistryPackage(corePackage, {});

    expect(result.status).toBe('unreachable');
    expect(result.reason).toBe('missing-mvr-resolver');
    expect(result.errorMessage).toContain('core.mvr is missing');
    expect(result.errorMessage).toContain('mvr is missing');
  });

  test('marks a package unreachable with a reason when resolver candidates are malformed', async () => {
    const result = await verifyMoveRegistryPackage(corePackage, {
      core: { mvr: {} },
      mvr: {},
    } as unknown as MoveRegistryResolver);

    expect(result.status).toBe('unreachable');
    expect(result.reason).toBe('invalid-mvr-resolver-shape');
    expect(result.errorMessage).toContain('core.mvr is missing resolvePackage()');
    expect(result.errorMessage).toContain('mvr is missing resolvePackage()');
  });

  test('uses the root MVR resolver when the core resolver shape is unavailable', async () => {
    const rootResolver: MoveRegistryPackageResolver = {
      resolvePackage: async () => ({
        package: packageId,
        packageInfoId,
      }),
    };

    const result = await verifyMoveRegistryPackage(corePackage, {
      core: { mvr: {} },
      mvr: rootResolver,
    } as unknown as MoveRegistryResolver);

    expect(result.status).toBe('verified');
  });

  test('requires every package to verify and at least one core package for release', async () => {
    const good = await verifyMoveRegistryPackagesForRelease(
      [corePackage],
      resolver(),
    );
    const noCore = await verifyMoveRegistryPackagesForRelease(
      [{ ...corePackage, role: 'dependency' }],
      resolver(),
    );
    const mismatch = await verifyMoveRegistryPackagesForRelease(
      [corePackage],
      resolver({
        packageId:
          '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      }),
    );
    const badPackageInfo = await verifyMoveRegistryPackagesForRelease(
      [corePackage],
      resolver({
        packageInfoId:
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      }),
    );

    expect(good.ok).toBe(true);
    expect(noCore.ok).toBe(false);
    expect(mismatch.ok).toBe(false);
    expect(badPackageInfo.ok).toBe(false);
  });
});
