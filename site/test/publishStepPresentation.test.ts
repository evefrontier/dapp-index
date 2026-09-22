import { describe, expect, test } from 'bun:test';
import { getNetworkStatusRow } from '../src/builder/publishStepPresentation';

describe('publish step presentation', () => {
  test('aligned wallet and target network on testnet', () => {
    const row = getNetworkStatusRow({
      suiNetwork: 'testnet',
      walletAddress: '0xabc',
      walletNetwork: 'testnet',
    });

    expect(row).toEqual({
      label: 'Network',
      status: 'testnet',
      detail: 'Wallet on testnet · Walrus publish enabled.',
      tone: 'ready',
    });
  });

  test('network mismatch shows switch guidance', () => {
    const row = getNetworkStatusRow({
      suiNetwork: 'testnet',
      walletAddress: '0xabc',
      walletNetwork: 'mainnet',
    });

    expect(row.status).toBe('Mismatch');
    expect(row.detail).toBe('Wallet on mainnet — switch to testnet.');
    expect(row.tone).toBe('warning');
  });

  test('unsupported env warns before wallet connect', () => {
    const row = getNetworkStatusRow({
      suiNetwork: 'devnet',
      walletAddress: null,
      walletNetwork: null,
    });

    expect(row).toEqual({
      label: 'Network',
      status: 'Required',
      detail: 'Walrus publish needs testnet or mainnet.',
      tone: 'warning',
    });
  });

  test('no wallet on supported network asks to connect on target', () => {
    const row = getNetworkStatusRow({
      suiNetwork: 'mainnet',
      walletAddress: null,
      walletNetwork: null,
    });

    expect(row.detail).toBe('Connect wallet on mainnet.');
  });
});
