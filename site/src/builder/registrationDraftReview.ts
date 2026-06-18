import {
  DAPP_INDEX_METADATA_SCHEMA,
  DAPP_INDEX_METADATA_SCHEMA_VERSION,
} from '@/constants';
import { canonicalStringify, sha256Utf8Bytes } from '@/utils/canonicalJson';
import {
  validateRegistryMetadataJson,
  type RegistryMetadataValidation,
} from '@/utils/registryMetadata';
import { createSchemaValidationIssues } from '@/utils/schemaValidationIssues';
import {
  validateRegistrationDraftFields,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFieldName,
  type RegistrationDraftFields,
} from './registrationDraftFields';
import {
  getReviewSlugBlockerMessage,
  isReviewSlugCheckReady,
  type RegistrationDraftSlugCheckState,
} from './registrationDraftSlugCheck';

export type {
  RegistrationDraftSlugCheckState,
  ReviewTone,
  SlugCheckPresentation,
  SlugCheckStatus,
} from './registrationDraftSlugCheck';
export {
  getSlugCheckPresentation,
  INITIAL_REGISTRATION_DRAFT_SLUG_CHECK,
  isReviewSlugCheckReady,
} from './registrationDraftSlugCheck';

export type RegistrationDraftMetadataJson = Record<string, unknown>;

export type RegistrationDraftReviewIssue = {
  id: string;
  label: string;
  message: string;
  severity: 'error' | 'warning';
};

export type RegistrationDraftReview = {
  canonicalJson: string;
  issues: RegistrationDraftReviewIssue[];
  metadata: RegistrationDraftMetadataJson;
  ready: boolean;
  schemaValidation: RegistryMetadataValidation;
};

export function getReviewNextBlockerMessage(
  review: RegistrationDraftReview,
  slugCheck: RegistrationDraftSlugCheckState,
): string | null {
  if (review.ready && isReviewSlugCheckReady(slugCheck)) {
    return null;
  }

  if (!review.ready) {
    const blockerCount = review.issues.filter(
      (issue) => issue.severity === 'error',
    ).length;
    if (blockerCount > 0) {
      return `Fix ${blockerCount} required issue${blockerCount === 1 ? '' : 's'} to continue.`;
    }
    return 'Complete required metadata to continue.';
  }

  return getReviewSlugBlockerMessage(slugCheck);
}

const FIELD_LABELS = {
  name: 'Name',
  slug: 'Slug',
  summary: 'Summary',
  description: 'Description',
  liveUrl: 'Live URL',
  repositoryUrl: 'Repo URL',
  documentationUrl: 'Docs URL',
  categories: 'Categories',
  smartAssemblyTypes: 'Smart assemblies',
  serverTenant: 'Server tenant',
  suiPackages: 'Packages',
} satisfies Record<RegistrationDraftFieldName, string>;

export function buildRegistrationDraftMetadata(
  fields: RegistrationDraftFields,
): RegistrationDraftMetadataJson {
  const metadata: RegistrationDraftMetadataJson = {
    schema: DAPP_INDEX_METADATA_SCHEMA,
    schemaVersion: DAPP_INDEX_METADATA_SCHEMA_VERSION,
    id: trimText(fields.slug),
    name: trimText(fields.name),
    summary: trimText(fields.summary),
    categories: [...fields.categories],
    liveUrl: trimText(fields.liveUrl),
    serverTenant: fields.serverTenant,
  };

  if (fields.suiPackages.length > 0) {
    metadata.suiPackages = fields.suiPackages.map((draftPackage) => {
      const packageMetadata: RegistrationDraftMetadataJson = {
        network: draftPackage.network,
        role: draftPackage.role,
        packageId: trimText(draftPackage.packageId),
      };
      addOptionalText(packageMetadata, 'mvrName', draftPackage.mvrName);
      addOptionalText(
        packageMetadata,
        'packageInfoId',
        draftPackage.packageInfoId,
      );
      return packageMetadata;
    });
  }

  addOptionalText(metadata, 'description', fields.description);
  addOptionalText(metadata, 'repositoryUrl', fields.repositoryUrl);
  addOptionalText(metadata, 'documentationUrl', fields.documentationUrl);
  if (fields.smartAssemblyTypes.length > 0) {
    metadata.smartAssemblyTypes = [...fields.smartAssemblyTypes];
  }

  return metadata;
}

export function createRegistrationDraftReview(
  fields: RegistrationDraftFields,
): RegistrationDraftReview {
  const metadata = buildRegistrationDraftMetadata(fields);
  const schemaValidation = validateRegistryMetadataJson(metadata);
  const issues = createRegistrationDraftReviewIssues({
    fieldErrors: validateRegistrationDraftFields(fields),
    fields,
    schemaValidation,
  });
  const canonicalJson = canonicalStringify(metadata);

  return {
    canonicalJson,
    issues,
    metadata,
    ready: schemaValidation.ok && !issues.some(isBlockingReviewIssue),
    schemaValidation,
  };
}

export async function createRegistrationMetadataHashHex(
  metadata: unknown,
): Promise<string> {
  const hashBytes = await sha256Utf8Bytes(canonicalStringify(metadata));
  return Array.from(hashBytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function createRegistrationDraftReviewIssues({
  fieldErrors,
  fields,
  schemaValidation,
}: {
  fieldErrors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  schemaValidation: RegistryMetadataValidation;
}): RegistrationDraftReviewIssue[] {
  return dedupeIssues([
    ...createFieldIssues(fieldErrors),
    ...createOptionalFieldWarnings(fields),
    ...createSchemaIssues(schemaValidation),
  ]);
}

function createFieldIssues(
  fieldErrors: RegistrationDraftFieldErrors,
): RegistrationDraftReviewIssue[] {
  return Object.entries(fieldErrors).map(([fieldName, message]) => ({
    id: `field.${fieldName}`,
    label: FIELD_LABELS[fieldName as RegistrationDraftFieldName],
    message,
    severity: 'error',
  }));
}

function createOptionalFieldWarnings(
  fields: RegistrationDraftFields,
): RegistrationDraftReviewIssue[] {
  const issues: RegistrationDraftReviewIssue[] = [];

  if (fields.suiPackages.length === 0) {
    issues.push({
      id: 'optional.suiPackages',
      label: 'Packages',
      message: 'Add a Sui package only if this dapp publishes or depends on Move code.',
      severity: 'warning',
    });
  } else {
    if (
      !fields.suiPackages.some((draftPackage) => draftPackage.role === 'core')
    ) {
      issues.push({
        id: 'suiPackages.core',
        label: 'Core package',
        message: 'Mark the main dapp package as core if one package is primary.',
        severity: 'warning',
      });
    }

    if (
      fields.suiPackages.some((draftPackage) => !draftPackage.mvrName.trim())
    ) {
      issues.push({
        id: 'suiPackages.mvrName',
        label: 'MVR name',
        message: 'Add an MVR name when the package has a Move Registry entry.',
        severity: 'warning',
      });
    }

    if (
      fields.suiPackages.some(
        (draftPackage) => !draftPackage.packageInfoId.trim(),
      )
    ) {
      issues.push({
        id: 'suiPackages.packageInfoId',
        label: 'PackageInfo ID',
        message: 'Add a PackageInfo ID when the package has one.',
        severity: 'warning',
      });
    }
  }

  issues.push(
    ...OPTIONAL_FIELD_WARNINGS.flatMap((warning) =>
      warning.isMissing(fields) ? [warning.toIssue()] : [],
    ),
  );

  return issues;
}

type OptionalFieldWarning = {
  id: string;
  isMissing: (fields: RegistrationDraftFields) => boolean;
  label: string;
  message: string;
  toIssue: () => RegistrationDraftReviewIssue;
};

const OPTIONAL_FIELD_WARNINGS: OptionalFieldWarning[] = [
  {
    id: 'optional.description',
    isMissing: (fields: RegistrationDraftFields) => !fields.description.trim(),
    label: 'Description',
    message: 'Add a description if this listing needs more context.',
    toIssue: () => ({
      id: 'optional.description',
      label: 'Description',
      message: 'Add a description if this listing needs more context.',
      severity: 'warning',
    }),
  },
  {
    id: 'optional.repositoryUrl',
    isMissing: (fields: RegistrationDraftFields) => !fields.repositoryUrl.trim(),
    label: 'Repo URL',
    message: 'Add a repo URL if the dapp code is public.',
    toIssue: () => ({
      id: 'optional.repositoryUrl',
      label: 'Repo URL',
      message: 'Add a repo URL if the dapp code is public.',
      severity: 'warning',
    }),
  },
  {
    id: 'optional.documentationUrl',
    isMissing: (fields: RegistrationDraftFields) =>
      !fields.documentationUrl.trim(),
    label: 'Docs URL',
    message: 'Add docs if setup or usage needs explanation.',
    toIssue: () => ({
      id: 'optional.documentationUrl',
      label: 'Docs URL',
      message: 'Add docs if setup or usage needs explanation.',
      severity: 'warning',
    }),
  },
];

function createSchemaIssues(
  schemaValidation: RegistryMetadataValidation,
): RegistrationDraftReviewIssue[] {
  return createSchemaValidationIssues(
    schemaValidation,
    formatSchemaIssueLabel,
  );
}

function formatSchemaIssueLabel(instancePath: string): string {
  const path = instancePath.replace(/^\//, '');
  if (!path) return 'Metadata';
  const [field] = path.split('/');
  return field
    ? FIELD_LABELS[field as RegistrationDraftFieldName] ?? field
    : 'Metadata';
}

function dedupeIssues(
  issues: RegistrationDraftReviewIssue[],
): RegistrationDraftReviewIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.id}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trimText(value: string): string {
  return value.trim();
}

function isBlockingReviewIssue(issue: RegistrationDraftReviewIssue): boolean {
  return issue.severity === 'error';
}

function addOptionalText(
  metadata: RegistrationDraftMetadataJson,
  key: string,
  value: string,
) {
  const trimmedValue = trimText(value);
  if (trimmedValue) metadata[key] = trimmedValue;
}
