import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiObjectId } from '@mysten/sui/utils';

function target(packageId: string, module: string, fn: string): string {
  const pkg = normalizeSuiObjectId(packageId);
  return `${pkg}::${module}::${fn}`;
}

export function buildRegisterAppTransaction(input: {
  packageId: string;
  registryId: string;
  slug: string;
  metadataUri: string;
  metadataHash: Uint8Array;
  categories: string[];
}): Transaction {
  const tx = new Transaction();
  tx.setGasBudgetIfNotSet(50_000_000n);
  tx.moveCall({
    target: target(input.packageId, 'registry', 'register_app'),
    arguments: [
      tx.object(input.registryId),
      tx.pure.string(input.slug),
      tx.pure.string(input.metadataUri),
      tx.pure.vector('u8', [...input.metadataHash]),
      tx.pure.vector('string', input.categories),
    ],
  });
  return tx;
}

export function buildUpdateAppTransaction(input: {
  packageId: string;
  registryId: string;
  slug: string;
  metadataUri: string;
  metadataHash: Uint8Array;
  categories: string[];
}): Transaction {
  const tx = new Transaction();
  tx.setGasBudgetIfNotSet(50_000_000n);
  tx.moveCall({
    target: target(input.packageId, 'registry', 'update_app'),
    arguments: [
      tx.object(input.registryId),
      tx.pure.string(input.slug),
      tx.pure.string(input.metadataUri),
      tx.pure.vector('u8', [...input.metadataHash]),
      tx.pure.vector('string', input.categories),
    ],
  });
  return tx;
}

export function buildRemoveAppTransaction(input: {
  packageId: string;
  registryId: string;
  slug: string;
}): Transaction {
  const tx = new Transaction();
  tx.setGasBudgetIfNotSet(50_000_000n);
  tx.moveCall({
    target: target(input.packageId, 'registry', 'remove_app'),
    arguments: [tx.object(input.registryId), tx.pure.string(input.slug)],
  });
  return tx;
}
