import type { DraftStep } from '@/storage/draftStorage';
import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
  type DappIndexCategoryId,
  type DappIndexServerTenant,
  type DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import {
  readRegistrationDraftPackages,
  validateRegistrationDraftPackages,
  type RegistrationDraftPackage,
} from './registrationDraftPackages';

export type RegistrationDraftFields = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  liveUrl: string;
  repositoryUrl: string;
  documentationUrl: string;
  categories: DappIndexCategoryId[];
  smartAssemblyTypes: DappIndexSmartAssemblyType[];
  serverTenant: DappIndexServerTenant | '';
  suiPackages: RegistrationDraftPackage[];
  domainProofUrl: string;
  notes: string;
};

export type RegistrationDraftFieldName = keyof RegistrationDraftFields;

export type RegistrationDraftFieldErrors = Partial<
  Record<RegistrationDraftFieldName, string>
>;

export const REGISTRATION_DRAFT_FIELD_KEYS = [
  'name',
  'slug',
  'summary',
  'description',
  'liveUrl',
  'repositoryUrl',
  'documentationUrl',
  'categories',
  'smartAssemblyTypes',
  'serverTenant',
  'suiPackages',
  'domainProofUrl',
  'notes',
] as const satisfies readonly RegistrationDraftFieldName[];

export const REGISTRATION_DRAFT_FIELD_STEPS = [
  'basics',
  'about',
  'discovery',
  'packages',
  'proofs',
] as const satisfies readonly DraftStep[];

export type RegistrationDraftFieldStep =
  (typeof REGISTRATION_DRAFT_FIELD_STEPS)[number];

const CATEGORY_VALUES = new Set<string>(
  DAPP_INDEX_CATEGORIES.map((category) => category.id),
);
const SMART_ASSEMBLY_VALUES = new Set<string>(
  DAPP_INDEX_SMART_ASSEMBLY_TYPES.map((assembly) => assembly.id),
);
const SERVER_TENANT_VALUES = new Set<string>(DAPP_INDEX_SERVER_TENANTS);
const SLUG_PATTERN = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
const REGISTRATION_DRAFT_FIELD_STEP_VALUES: ReadonlySet<DraftStep> = new Set(
  REGISTRATION_DRAFT_FIELD_STEPS,
);

const STEP_FIELD_GROUPS = {
  basics: ['name', 'slug', 'summary'],
  about: ['description', 'liveUrl', 'repositoryUrl', 'documentationUrl'],
  discovery: ['categories', 'smartAssemblyTypes', 'serverTenant'],
  packages: ['suiPackages'],
  proofs: ['domainProofUrl', 'notes'],
} satisfies Record<
  RegistrationDraftFieldStep,
  readonly RegistrationDraftFieldName[]
>;

export function createRegistrationDraftFields(): RegistrationDraftFields {
  return {
    name: '',
    slug: '',
    summary: '',
    description: '',
    liveUrl: '',
    repositoryUrl: '',
    documentationUrl: '',
    categories: [],
    smartAssemblyTypes: [],
    serverTenant: '',
    suiPackages: [],
    domainProofUrl: '',
    notes: '',
  };
}

export function readRegistrationDraftFields(
  fields: Record<string, unknown>,
): RegistrationDraftFields {
  return {
    name: readString(fields.name),
    slug: readString(fields.slug),
    summary: readString(fields.summary),
    description: readString(fields.description),
    liveUrl: readString(fields.liveUrl),
    repositoryUrl: readString(fields.repositoryUrl),
    documentationUrl: readString(fields.documentationUrl),
    categories: readStringArray(fields.categories, isDappIndexCategoryId),
    smartAssemblyTypes: readStringArray(
      fields.smartAssemblyTypes,
      isDappIndexSmartAssemblyType,
    ),
    serverTenant: isDappIndexServerTenant(fields.serverTenant)
      ? fields.serverTenant
      : '',
    suiPackages: readRegistrationDraftPackages(fields),
    domainProofUrl: readString(fields.domainProofUrl),
    notes: readString(fields.notes),
  };
}

export function createRegistrationDraftFieldPatch(
  fields: Partial<RegistrationDraftFields>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  for (const key of REGISTRATION_DRAFT_FIELD_KEYS) {
    if (!Object.hasOwn(fields, key)) continue;

    const value = fields[key];
    patch[key] = Array.isArray(value) ? [...value] : value;
  }

  return patch;
}

export function validateRegistrationDraftFields(
  fields: RegistrationDraftFields,
): RegistrationDraftFieldErrors {
  return {
    ...validateBasicsFields(fields),
    ...validateAboutFields(fields),
    ...validateDiscoveryFields(fields),
    ...validateRegistrationDraftPackages(fields.suiPackages).fieldErrors,
    ...validateProofsFields(fields),
  };
}

export function isRegistrationDraftFieldStep(
  step: DraftStep,
): step is RegistrationDraftFieldStep {
  return REGISTRATION_DRAFT_FIELD_STEP_VALUES.has(step);
}

export function isRegistrationDraftStepValid(
  step: DraftStep,
  fields: RegistrationDraftFields,
): boolean {
  if (!isRegistrationDraftFieldStep(step)) return true;

  const errors = validateRegistrationDraftFields(fields);
  return STEP_FIELD_GROUPS[step].every((fieldName) => !errors[fieldName]);
}

function validateBasicsFields(
  fields: RegistrationDraftFields,
): RegistrationDraftFieldErrors {
  const errors: RegistrationDraftFieldErrors = {};

  if (!hasText(fields.name)) {
    errors.name = 'Name is required.';
  } else if (fields.name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.';
  }

  if (!hasText(fields.slug)) {
    errors.slug = 'Slug is required.';
  } else if (fields.slug.length > 50) {
    errors.slug = 'Slug must be 50 characters or fewer.';
  } else if (!SLUG_PATTERN.test(fields.slug)) {
    errors.slug = 'Use lowercase letters, numbers, and hyphens.';
  }

  if (!hasText(fields.summary)) {
    errors.summary = 'Summary is required.';
  } else if (fields.summary.length > 180) {
    errors.summary = 'Summary must be 180 characters or fewer.';
  }

  return errors;
}

function validateAboutFields(
  fields: RegistrationDraftFields,
): RegistrationDraftFieldErrors {
  const errors: RegistrationDraftFieldErrors = {};

  if (hasText(fields.description) && fields.description.length > 4000) {
    errors.description = 'Description must be 4000 characters or fewer.';
  }

  if (!hasText(fields.liveUrl)) {
    errors.liveUrl = 'Live URL is required.';
  } else if (!isHttpsUrl(fields.liveUrl)) {
    errors.liveUrl = 'Use an HTTPS URL.';
  }

  if (hasText(fields.repositoryUrl) && !isHttpsUrl(fields.repositoryUrl)) {
    errors.repositoryUrl = 'Use an HTTPS URL.';
  }

  if (hasText(fields.documentationUrl) && !isHttpsUrl(fields.documentationUrl)) {
    errors.documentationUrl = 'Use an HTTPS URL.';
  }

  return errors;
}

function validateDiscoveryFields(
  fields: RegistrationDraftFields,
): RegistrationDraftFieldErrors {
  const errors: RegistrationDraftFieldErrors = {};

  if (fields.categories.length === 0) {
    errors.categories = 'Choose at least one category.';
  } else if (fields.categories.length > 5) {
    errors.categories = 'Choose no more than five categories.';
  } else if (
    hasDuplicate(fields.categories) ||
    !fields.categories.every(isDappIndexCategoryId)
  ) {
    errors.categories = 'Choose valid categories.';
  }

  if (
    hasDuplicate(fields.smartAssemblyTypes) ||
    !fields.smartAssemblyTypes.every(isDappIndexSmartAssemblyType)
  ) {
    errors.smartAssemblyTypes = 'Choose valid smart assemblies.';
  }

  if (!fields.serverTenant) {
    errors.serverTenant = 'Choose a server tenant.';
  } else if (!isDappIndexServerTenant(fields.serverTenant)) {
    errors.serverTenant = 'Choose a valid server tenant.';
  }

  return errors;
}

function validateProofsFields(
  fields: RegistrationDraftFields,
): RegistrationDraftFieldErrors {
  const errors: RegistrationDraftFieldErrors = {};

  if (hasText(fields.domainProofUrl) && !isHttpsUrl(fields.domainProofUrl)) {
    errors.domainProofUrl = 'Use an HTTPS URL.';
  }

  if (fields.notes.length > 2000) {
    errors.notes = 'Notes must be 2000 characters or fewer.';
  }

  return errors;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray<T extends string>(
  value: unknown,
  isAllowedValue: (value: unknown) => value is T,
): T[] {
  if (!Array.isArray(value)) return [];

  const nextValues: T[] = [];
  for (const item of value) {
    if (!isAllowedValue(item) || nextValues.includes(item)) continue;
    nextValues.push(item);
  }
  return nextValues;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function hasDuplicate(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function isDappIndexCategoryId(value: unknown): value is DappIndexCategoryId {
  return typeof value === 'string' && CATEGORY_VALUES.has(value);
}

function isDappIndexSmartAssemblyType(
  value: unknown,
): value is DappIndexSmartAssemblyType {
  return typeof value === 'string' && SMART_ASSEMBLY_VALUES.has(value);
}

function isDappIndexServerTenant(
  value: unknown,
): value is DappIndexServerTenant {
  return typeof value === 'string' && SERVER_TENANT_VALUES.has(value);
}
