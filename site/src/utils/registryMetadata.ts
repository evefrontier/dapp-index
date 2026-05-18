import type { AnySchema, ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import registryEntrySchema from '../../../registry/schema/registry-entry.schema.json';

/** Draft 2020-12: matches `$schema` on `registry-entry.schema.json`. */
const ajv = new Ajv2020({ allErrors: true, strict: true });

const validateRegistryEntry = ajv.compile(
  registryEntrySchema as unknown as AnySchema,
);

export type RegistryMetadataValidation =
  | { ok: true }
  | { ok: false; errors: ErrorObject[] | null | undefined };

export function validateRegistryMetadataJson(
  data: unknown,
): RegistryMetadataValidation {
  const ok = validateRegistryEntry(data);
  if (ok) {
    return { ok: true };
  }
  return { ok: false, errors: validateRegistryEntry.errors };
}
