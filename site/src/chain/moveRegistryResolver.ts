import {
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient,
} from '@mysten/sui/jsonRpc';
import type { DappIndexSuiNetwork } from '@/types/dapp-index';
import type {
  MoveRegistryPackageResolver,
  MoveRegistryResolver,
} from './moveRegistry.types';

type MoveRegistryClient = {
  core: {
    mvr: {
      resolvePackage(options: { package: string }): Promise<{
        package: string;
        packageInfoId?: string;
      }>;
    };
  };
};

export type CreateMoveRegistryResolverOptions = {
  createClient?: (network: DappIndexSuiNetwork) => MoveRegistryClient;
};

export function createMoveRegistryResolver({
  createClient = createMoveRegistryClient,
}: CreateMoveRegistryResolverOptions = {}): MoveRegistryResolver {
  const clients = new Map<DappIndexSuiNetwork, MoveRegistryClient>();

  const resolver: MoveRegistryPackageResolver = {
    resolvePackage: async ({ package: mvrName, network }) => {
      const client = getNetworkClient(network, clients, createClient);
      const resolved = await client.core.mvr.resolvePackage({
        package: mvrName,
      });

      return { ...resolved, network };
    },
  };

  return { mvr: resolver };
}

function getNetworkClient(
  network: DappIndexSuiNetwork,
  clients: Map<DappIndexSuiNetwork, MoveRegistryClient>,
  createClient: (network: DappIndexSuiNetwork) => MoveRegistryClient,
): MoveRegistryClient {
  const cachedClient = clients.get(network);
  if (cachedClient) return cachedClient;

  const client = createClient(network);
  clients.set(network, client);
  return client;
}

function createMoveRegistryClient(
  network: DappIndexSuiNetwork,
): MoveRegistryClient {
  return new SuiJsonRpcClient({
    network,
    url: getJsonRpcFullnodeUrl(network),
  });
}
