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

function viteFlagEnabled(raw: unknown): boolean {
  return typeof raw === 'string' && raw.trim().toLowerCase() === 'true';
}

/**
 * Whether to merge local fixture listings into the catalog.
 *
 * Off unless `VITE_ENABLE_FIXTURE_DATA=true`, so a deployed environment only
 * ever shows fixtures when it opts in. `test` and `live` leave this unset and
 * therefore render chain data only — a chain read failure must surface as an
 * empty catalog, never as fabricated listings.
 */
export function viteFixtureDataEnabled(): boolean {
  return viteFlagEnabled(import.meta.env.VITE_ENABLE_FIXTURE_DATA);
}

/**
 * Whether the Walrus read/publish path is available.
 *
 * Off unless `VITE_ENABLE_WALRUS=true`. S3 is the current storage provider; the
 * Walrus code is kept for the later mainnet flow and gated behind this flag
 * rather than deleted.
 */
export function viteWalrusEnabled(): boolean {
  return viteFlagEnabled(import.meta.env.VITE_ENABLE_WALRUS);
}

/** Lambda Function URL / upload API base (no trailing slash). */
export function viteUploadApiBase(): string | undefined {
  const raw = import.meta.env.VITE_UPLOAD_API_BASE;
  if (typeof raw !== 'string') return undefined;
  const t = raw.trim().replace(/\/+$/, '');
  return t === '' ? undefined : t;
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

/**
 * Base URL for Walrus aggregator reads (no trailing slash required).
 * `undefined` while Walrus is disabled, which makes `walrus://` URIs resolve to
 * null instead of reaching an aggregator.
 */
export function viteWalrusAggregatorUrl(): string | undefined {
  if (!viteWalrusEnabled()) return undefined;
  const raw = import.meta.env.VITE_WALRUS_AGGREGATOR_URL;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t !== '') return t;
  }
  return defaultWalrusAggregatorBaseUrl(viteSuiNetwork());
}

/**
 * Optional Walrus upload relay host (enables browser-friendly uploads).
 * `undefined` while Walrus is disabled.
 */
export function viteWalrusUploadRelayHost(): string | undefined {
  if (!viteWalrusEnabled()) return undefined;
  const raw = import.meta.env.VITE_WALRUS_UPLOAD_RELAY;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t !== '') return t;
  }
  return defaultWalrusUploadRelayHost(viteSuiNetwork());
}
