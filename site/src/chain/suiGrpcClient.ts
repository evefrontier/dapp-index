/**
 * Sui gRPC fullnode client used for registry reads.
 *
 * Public fullnode JSON-RPC is deprecated and no longer served, so all direct
 * chain reads in this app go through gRPC. Wallet and transaction paths use the
 * gRPC client provided by `@evefrontier/dapp-kit`.
 */

import { SuiGrpcClient } from '@mysten/sui/grpc';
import type { SuiNetworkName } from '@/chain/env';

const GRPC_FULLNODE_URLS = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
} as const satisfies Record<SuiNetworkName, string>;

export function suiGrpcFullnodeUrl(network: SuiNetworkName): string {
  return GRPC_FULLNODE_URLS[network];
}

export function createSuiGrpcClient(network: SuiNetworkName): SuiGrpcClient {
  return new SuiGrpcClient({
    network,
    baseUrl: suiGrpcFullnodeUrl(network),
  });
}
