/** Sui / registry env read at runtime (Vite `import.meta.env`). */

import {
  DAPP_MEDIA_CDN_ORIGIN,
  WALRUS_AGGREGATOR_MAINNET_URL,
  WALRUS_AGGREGATOR_TESTNET_URL,
  WALRUS_UPLOAD_RELAY_MAINNET_URL,
  WALRUS_UPLOAD_RELAY_TESTNET_URL,
} from '@/constants';

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

/**
 * Public media CDN origin (no trailing slash).
 * Override with `VITE_MEDIA_CDN_BASE` only for non-prod/test; default is
 * terraform `public_url` (`https://dapp-media.evefrontier.com`).
 */
export function viteMediaCdnBase(): string {
  const raw = import.meta.env.VITE_MEDIA_CDN_BASE;
  if (typeof raw === 'string') {
    const t = raw.trim().replace(/\/+$/, '');
    if (t !== '') return t;
  }
  return DAPP_MEDIA_CDN_ORIGIN;
}

function defaultWalrusAggregatorBaseUrl(
  network: SuiNetworkName,
): string | undefined {
  if (network === 'testnet') return WALRUS_AGGREGATOR_TESTNET_URL;
  if (network === 'mainnet') return WALRUS_AGGREGATOR_MAINNET_URL;
  return undefined;
}

function defaultWalrusUploadRelayHost(
  network: SuiNetworkName,
): string | undefined {
  if (network === 'testnet') return WALRUS_UPLOAD_RELAY_TESTNET_URL;
  if (network === 'mainnet') return WALRUS_UPLOAD_RELAY_MAINNET_URL;
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
