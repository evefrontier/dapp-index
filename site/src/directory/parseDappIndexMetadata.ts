import type { DappIndexEntry } from '@/types/dapp-index';
import { validateRegistryMetadataJson } from '@/utils/registryMetadata';

export function parseDappIndexMetadataJson(
  data: unknown,
): { ok: true; entry: DappIndexEntry } | { ok: false } {
  const validation = validateRegistryMetadataJson(data);
  if (!validation.ok) return { ok: false };
  return { ok: true, entry: data as DappIndexEntry };
}
