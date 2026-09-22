import type { RegistryMetadataValidation } from './registryMetadata';

export type SchemaValidationIssue = {
  id: string;
  label: string;
  message: string;
  severity: 'error';
};

export function createSchemaValidationIssues(
  schemaValidation: RegistryMetadataValidation,
  formatLabel: (instancePath: string) => string = () => 'Metadata',
): SchemaValidationIssue[] {
  if (schemaValidation.ok) return [];

  return (schemaValidation.errors ?? []).map((error, index) => ({
    id: `schema.${error.instancePath || 'root'}.${error.keyword}.${index}`,
    label: formatLabel(error.instancePath),
    message: error.message
      ? `Schema ${error.message}.`
      : 'Schema validation failed.',
    severity: 'error',
  }));
}
