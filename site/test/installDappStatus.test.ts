import { describe, expect, test } from 'bun:test';
import type { Assemblies, AssemblyType } from '@evefrontier/dapp-kit';
import { getInstallDappStatus } from '@/directory/installDappStatus';

const LIVE_URL = 'https://chosen-dapp.example';

function fakeAssembly(dappURL: string): AssemblyType<Assemblies> {
  return { dappURL } as unknown as AssemblyType<Assemblies>;
}

const baseInput = {
  assembly: fakeAssembly('https://dapp-index.example'),
  walletSupportsSponsoredTx: true,
  walletAddress: '0xwallet',
  assemblyOwnerAddress: '0xwallet',
  liveUrl: LIVE_URL,
};

describe('getInstallDappStatus', () => {
  test('no-assembly when not opened from inside a Smart Assembly', () => {
    const status = getInstallDappStatus({ ...baseInput, assembly: null });
    expect(status).toBe('no-assembly');
  });

  test('wallet-not-connected when no wallet address', () => {
    const status = getInstallDappStatus({ ...baseInput, walletAddress: null });
    expect(status).toBe('wallet-not-connected');
  });

  test('wallet-not-connected takes precedence over no-assembly', () => {
    // A disconnected visitor always has a null assembly, because
    // SmartObjectProvider gates its fetch on the wallet connection. Reporting
    // 'no-assembly' here would tell them to open the page from an assembly when
    // connecting is what they actually need to do.
    const status = getInstallDappStatus({
      ...baseInput,
      walletAddress: null,
      assembly: null,
    });
    expect(status).toBe('wallet-not-connected');
  });

  test('wallet-unsupported when the connected wallet lacks the sponsored-tx feature', () => {
    const status = getInstallDappStatus({
      ...baseInput,
      walletSupportsSponsoredTx: false,
    });
    expect(status).toBe('wallet-unsupported');
  });

  test('owner-unknown when the assembly owner could not be resolved', () => {
    const status = getInstallDappStatus({
      ...baseInput,
      assemblyOwnerAddress: null,
    });
    expect(status).toBe('owner-unknown');
  });

  test('not-owner when the connected wallet does not own the assembly', () => {
    const status = getInstallDappStatus({
      ...baseInput,
      assemblyOwnerAddress: '0xsomeone-else',
    });
    expect(status).toBe('not-owner');
  });

  test('installed when the assembly already points at this liveUrl', () => {
    const status = getInstallDappStatus({
      ...baseInput,
      assembly: fakeAssembly(LIVE_URL),
    });
    expect(status).toBe('installed');
  });

  test('installed ignores trailing slash and scheme/host casing differences', () => {
    const status = getInstallDappStatus({
      ...baseInput,
      assembly: fakeAssembly(`${LIVE_URL.toUpperCase()}/`),
    });
    expect(status).toBe('installed');
  });

  test('installable (not installed) when only the path case differs', () => {
    const status = getInstallDappStatus({
      ...baseInput,
      assembly: fakeAssembly(`${LIVE_URL}/App`),
      liveUrl: `${LIVE_URL}/app`,
    });
    expect(status).toBe('installable');
  });

  test('installable when the assembly points elsewhere', () => {
    const status = getInstallDappStatus(baseInput);
    expect(status).toBe('installable');
  });
});
