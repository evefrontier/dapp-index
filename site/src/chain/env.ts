/** Sui / registry env read at runtime (Vite `import.meta.env`). */

export type SuiNetworkName = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export function viteSuiNetwork(): SuiNetworkName {
  const raw = import.meta.env.VITE_SUI_NETWORK;
  if (
    raw === 'testnet' ||
    raw === 'mainnet' ||
    raw === 'devnet' ||
    raw === 'localnet'
  ) {
    return raw;
  }
  return 'testnet';
}

export function vitePackageId(): string | undefined {
  const raw = import.meta.env.VITE_PACKAGE_ID;
  if (typeof raw !== 'string') return undefined;
  const t = raw.trim();
  return t === '' ? undefined : t;
}

export function viteRegistryId(): string | undefined {
  const raw = import.meta.env.VITE_REGISTRY_ID;
  if (typeof raw !== 'string') return undefined;
  const t = raw.trim();
  return t === '' ? undefined : t;
}

export function registryConfigured(): boolean {
  return Boolean(vitePackageId() && viteRegistryId());
}

function defaultWalrusAggregatorBaseUrl(
  network: SuiNetworkName,
): string | undefined {
  if (network === 'testnet')
    return 'https://aggregator.walrus-testnet.walrus.space';
  if (network === 'mainnet')
    return 'https://aggregator.walrus-mainnet.walrus.space';
  return undefined;
}

function defaultWalrusUploadRelayHost(
  network: SuiNetworkName,
): string | undefined {
  if (network === 'testnet') return 'https://upload-relay.testnet.walrus.space';
  if (network === 'mainnet') return 'https://upload-relay.mainnet.walrus.space';
  return undefined;
}

/** Base URL for Walrus aggregator reads (no trailing slash required). */
export function viteWalrusAggregatorUrl(): string | undefined {
  const raw = import.meta.env.VITE_WALRUS_AGGREGATOR_URL;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t !== '') return t;
  }
  return defaultWalrusAggregatorBaseUrl(viteSuiNetwork());
}

/** Optional Walrus upload relay host (enables browser-friendly uploads). */
export function viteWalrusUploadRelayHost(): string | undefined {
  const raw = import.meta.env.VITE_WALRUS_UPLOAD_RELAY;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t !== '') return t;
  }
  return defaultWalrusUploadRelayHost(viteSuiNetwork());
}
