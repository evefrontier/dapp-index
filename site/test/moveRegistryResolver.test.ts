import { describe, expect, test } from 'bun:test';
import { createMoveRegistryResolver } from '../src/chain/moveRegistryResolver';
import type { DappIndexSuiNetwork } from '../src/types/dapp-index';

describe('Move Registry resolver client', () => {
  test('uses one MVR client per requested package network', async () => {
    const createdNetworks: DappIndexSuiNetwork[] = [];
    const resolver = createMoveRegistryResolver({
      createClient: (network) => {
        createdNetworks.push(network);
        return {
          core: {
            mvr: {
              resolvePackage: async ({ package: mvrName }) => ({
                package: `${network}:${mvrName}`,
              }),
            },
          },
        };
      },
    });

    await expect(
      resolver.mvr?.resolvePackage({
        package: '@frontier/map',
        network: 'mainnet',
      }),
    ).resolves.toEqual({
      package: 'mainnet:@frontier/map',
      network: 'mainnet',
    });

    await resolver.mvr?.resolvePackage({
      package: '@frontier/map',
      network: 'mainnet',
    });
    await resolver.mvr?.resolvePackage({
      package: '@frontier/map',
      network: 'testnet',
    });

    expect(createdNetworks).toEqual(['mainnet', 'testnet']);
  });
});
