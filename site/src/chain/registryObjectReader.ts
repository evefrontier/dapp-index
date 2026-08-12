/**
 * Single-object gRPC reads for registry lookups.
 *
 * `LedgerService.BatchGetObjects` reports a missing object as a per-result
 * `NOT_FOUND` status rather than throwing, which is what lets a slug lookup tell
 * "this slug is free" apart from "the fullnode call failed". The higher-level
 * `CoreClient.getObject` helpers collapse both into a generic `Error`, so this
 * reader talks to the service directly and maps the status into a domain result.
 */

import type { SuiGrpcClient } from '@mysten/sui/grpc';

/** `google.rpc.Code.NOT_FOUND`. */
const GRPC_STATUS_NOT_FOUND = 5;

const OBJECT_CONTENTS_READ_MASK = ['object_id', 'object_type', 'contents'];

export type RegistryObjectRead =
  | { status: 'found'; contents: Uint8Array }
  | { status: 'notFound' }
  | { status: 'failed'; message: string };

export type RegistryObjectReader = (
  objectId: string,
  options?: { signal?: AbortSignal },
) => Promise<RegistryObjectRead>;

export function createRegistryObjectReader(
  client: SuiGrpcClient,
): RegistryObjectReader {
  return async (objectId, options) => {
    const { response } = await client.ledgerService.batchGetObjects(
      {
        requests: [{ objectId }],
        readMask: { paths: OBJECT_CONTENTS_READ_MASK },
      },
      options?.signal ? { abort: options.signal } : {},
    );

    const [result] = response.objects;
    if (!result) {
      return {
        status: 'failed',
        message: 'Fullnode returned no result for the requested object.',
      };
    }

    if (result.result.oneofKind === 'error') {
      const { code, message } = result.result.error;
      if (code === GRPC_STATUS_NOT_FOUND) return { status: 'notFound' };
      return {
        status: 'failed',
        message: message || `Fullnode returned gRPC status ${code}.`,
      };
    }

    if (result.result.oneofKind !== 'object') {
      return {
        status: 'failed',
        message: 'Fullnode returned an unexpected object result.',
      };
    }

    const contents = result.result.object.contents?.value;
    if (!contents) {
      return {
        status: 'failed',
        message: 'Fullnode returned an object without contents.',
      };
    }

    return { status: 'found', contents };
  };
}
