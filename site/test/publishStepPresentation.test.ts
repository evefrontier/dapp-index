import { describe, expect, test } from 'bun:test';
import { getPublishStatusRows } from '../src/builder/publishStepPresentation';
import type { PublishStepControllerState } from '../src/builder/publishStepPresentation';

function createState(
  overrides: Partial<PublishStepControllerState> = {},
): PublishStepControllerState {
  return {
    mediaItemCount: 0,
    publishReadiness: { ready: true, blockers: [] },
    publishState: { status: 'idle', stage: 'Not started' },
    suiNetwork: 'testnet',
    walletAddress: '0xabc',
    walletBalanceStatus: { kind: 'skipped', reason: 'Not checked.' },
    walletNetwork: 'testnet',
    onConnectWallet: () => {},
    onPublish: async () => {},
    ...overrides,
  } as PublishStepControllerState;
}

describe('publish step presentation', () => {
  test('aligned wallet and target network on testnet', () => {
    const rows = getPublishStatusRows(createState());

    expect(rows.walletNetwork.status).toBe('Ready');
    expect(rows.targetNetwork).toEqual({
      label: 'Target network',
      status: 'testnet',
      detail: 'S3 media upload + Sui registry.',
      tone: 'ready',
    });
  });

  test('network mismatch shows mismatch status', () => {
    const rows = getPublishStatusRows(
      createState({ walletNetwork: 'mainnet' }),
    );

    expect(rows.walletNetwork.status).toBe('Mismatch');
    expect(rows.walletNetwork.detail).toBe('mainnet');
    expect(rows.walletNetwork.tone).toBe('warning');
  });

  test('unsupported env warns on the target network row', () => {
    const rows = getPublishStatusRows(
      createState({
        suiNetwork: 'devnet',
        walletAddress: null,
        walletNetwork: null,
      }),
    );

    expect(rows.targetNetwork).toEqual({
      label: 'Target network',
      status: 'devnet',
      detail: 'Use testnet or mainnet.',
      tone: 'warning',
    });
    expect(rows.walletNetwork.status).toBe('Required');
  });

  test('no wallet on supported network still reports the target', () => {
    const rows = getPublishStatusRows(
      createState({
        suiNetwork: 'mainnet',
        walletAddress: null,
        walletNetwork: null,
      }),
    );

    expect(rows.targetNetwork.status).toBe('mainnet');
    expect(rows.targetNetwork.tone).toBe('ready');
    expect(rows.walletNetwork.detail).toBe('Not connected.');
  });
});
