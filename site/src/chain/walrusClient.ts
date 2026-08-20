import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';

import { suiGrpcFullnodeUrl } from '@/chain/suiGrpcClient';

import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

export type WalrusChainNetwork = 'mainnet' | 'testnet';

export function isWalrusChainNetwork(
  network: string,
): network is WalrusChainNetwork {
  return network === 'mainnet' || network === 'testnet';
}

export type CreateWalrusSuiClientOptions = {
  /** Must be `mainnet` or `testnet` (Walrus contracts are only deployed there). */
  network: WalrusChainNetwork;
  /** Optional gRPC fullnode base URL override (should include `:443` for HTTPS fullnodes). */
  grpcBaseUrl?: string;
  /** Optional Walrus upload relay host (e.g. `https://upload-relay.testnet.walrus.space`). */
  uploadRelayHost?: string;
};

/**
 * Sui gRPC client extended with the Walrus SDK (`client.walrus`).
 *
 * Note: Walrus only supports Sui `mainnet` and `testnet` today.
 */
export function createWalrusSuiClient(options: CreateWalrusSuiClientOptions) {
  const baseUrl =
    options.grpcBaseUrl?.trim() || suiGrpcFullnodeUrl(options.network);

  const uploadRelayHost = options.uploadRelayHost?.trim();
  const uploadRelay =
    uploadRelayHost && uploadRelayHost.length > 0
      ? {
          host: uploadRelayHost,
          sendTip: { max: 1_000 },
        }
      : undefined;

  return new SuiGrpcClient({
    network: options.network,
    baseUrl,
  }).$extend(
    walrus({
      wasmUrl: walrusWasmUrl,
      ...(uploadRelay ? { uploadRelay } : {}),
      storageNodeClientOptions: {
        timeout: 60_000,
      },
    }),
  );
}

export function walrusBlobReadUrl(
  aggregatorBaseUrl: string,
  blobId: string,
): string {
  const base = aggregatorBaseUrl.trim().replace(/\/+$/, '');
  return `${base}/v1/blobs/${blobId}`;
}

export function walrusBlobUri(blobId: string): `walrus://blob/${string}` {
  return `walrus://blob/${blobId}`;
}
