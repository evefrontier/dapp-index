import { describe, expect, test } from 'bun:test';
import { buildRemoveAppTransaction } from '../src/chain/registerTransactions';

const PACKAGE_ID = `0x${'ab'.repeat(32)}`;
const REGISTRY_ID = `0x${'81'.repeat(32)}`;

describe('buildRemoveAppTransaction', () => {
  test('targets registry::remove_app with the registry object and slug', () => {
    const tx = buildRemoveAppTransaction({
      packageId: PACKAGE_ID,
      registryId: REGISTRY_ID,
      slug: 'route-planner',
    });

    const data = tx.getData();
    const [command] = data.commands;

    expect(data.commands).toHaveLength(1);
    expect(command?.$kind).toBe('MoveCall');
    expect(command?.MoveCall?.package).toBe(PACKAGE_ID);
    expect(command?.MoveCall?.module).toBe('registry');
    expect(command?.MoveCall?.function).toBe('remove_app');
    expect(command?.MoveCall?.arguments).toHaveLength(2);
  });

  test('accepts a short-form package id and normalizes it', () => {
    const tx = buildRemoveAppTransaction({
      packageId: '0x2',
      registryId: REGISTRY_ID,
      slug: 'route-planner',
    });

    expect(tx.getData().commands[0]?.MoveCall?.package).toBe(
      `0x${'0'.repeat(63)}2`,
    );
  });
});
