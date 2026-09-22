import { findOwnerByAddress, getDappUrl } from '@evefrontier/dapp-kit';
import type { Assemblies, AssemblyType } from '@evefrontier/dapp-kit';

export type InstallDappStatus =
  /**
   * Opened outside a Smart Assembly, so there is no object to install onto.
   * Only reachable with a wallet connected — see the ordering note in
   * {@link getInstallDappStatus}.
   */
  | 'no-assembly'
  /** No wallet connected yet. */
  | 'wallet-not-connected'
  /** Connected wallet doesn't implement the evefrontier:sponsoredTransaction feature. */
  | 'wallet-unsupported'
  /** The assembly's owner couldn't be resolved, so ownership can't be verified. */
  | 'owner-unknown'
  /** Connected wallet isn't the assembly's owning character. */
  | 'not-owner'
  /** The assembly's dappURL already points at this listing's liveUrl. */
  | 'installed'
  | 'installable';

/**
 * Scheme and host are case-insensitive and already normalized (lowercased) by
 * the URL parser; path and query are left as-is since they're case-sensitive.
 * Falls back to a plain lowercase compare if the input isn't a valid absolute URL.
 */
function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  try {
    const url = new URL(trimmed);
    const pathname = url.pathname.replace(/\/+$/, '');
    return `${url.protocol}//${url.host}${pathname}${url.search}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

export function getInstallDappStatus(input: {
  assembly: AssemblyType<Assemblies> | null;
  /** Whether the currently connected wallet implements evefrontier:sponsoredTransaction. */
  walletSupportsSponsoredTx: boolean;
  walletAddress: string | null;
  /** Null when the assembly's owner couldn't be resolved (not merely "still loading"). */
  assemblyOwnerAddress: string | null;
  liveUrl: string;
}): InstallDappStatus {
  const {
    assembly,
    walletSupportsSponsoredTx,
    walletAddress,
    assemblyOwnerAddress,
    liveUrl,
  } = input;

  // Wallet first: SmartObjectProvider only fetches the assembly once a wallet
  // is connected, so a disconnected visitor always has a null assembly. If
  // 'no-assembly' were checked first it would mask every disconnected case and
  // report "not opened from an assembly" to someone who simply hasn't connected.
  if (!walletAddress) return 'wallet-not-connected';
  if (!assembly) return 'no-assembly';
  if (!walletSupportsSponsoredTx) return 'wallet-unsupported';
  if (assemblyOwnerAddress === null) return 'owner-unknown';
  if (!findOwnerByAddress(assemblyOwnerAddress, walletAddress)) {
    return 'not-owner';
  }

  const currentUrl = getDappUrl(assembly);
  if (currentUrl && normalizeUrl(currentUrl) === normalizeUrl(liveUrl)) {
    return 'installed';
  }

  return 'installable';
}
