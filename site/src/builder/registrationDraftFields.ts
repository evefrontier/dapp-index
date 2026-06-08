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
  RegistrationDraftAboutSchema,
  RegistrationDraftBasicsSchema,
  RegistrationDraftDiscoverySchema,
  RegistrationDraftFieldsSchema,
  RegistrationDraftPackagesStepSchema,
} from '@/schemas/registration-draft-fields';
import {
  zodIssuesToFieldErrors,
  zodSafeParseFieldErrors,
} from '@/schemas/zodFieldErrors';
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
] as const satisfies readonly RegistrationDraftFieldName[];

export const REGISTRATION_DRAFT_FIELD_STEPS = [
  'basics',
  'about',
  'discovery',
  'packages',
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
const REGISTRATION_DRAFT_FIELD_STEP_VALUES: ReadonlySet<DraftStep> = new Set(
  REGISTRATION_DRAFT_FIELD_STEPS,
);

const STEP_SCHEMAS = {
  basics: RegistrationDraftBasicsSchema,
  about: RegistrationDraftAboutSchema,
  discovery: RegistrationDraftDiscoverySchema,
  packages: RegistrationDraftPackagesStepSchema,
} as const;

const STEP_FIELD_GROUPS = {
  basics: ['name', 'slug', 'summary'],
  about: ['description', 'liveUrl', 'repositoryUrl', 'documentationUrl'],
  discovery: ['categories', 'smartAssemblyTypes', 'serverTenant'],
  packages: ['suiPackages'],
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
  const fieldErrors = zodSafeParseFieldErrors(
    RegistrationDraftFieldsSchema,
    fields,
    REGISTRATION_DRAFT_FIELD_KEYS,
  );
  const packageValidation = validateRegistrationDraftPackages(fields.suiPackages);

  return {
    ...fieldErrors,
    ...packageValidation.fieldErrors,
  };
}

export function validateRegistrationDraftStepFields(
  step: RegistrationDraftFieldStep,
  fields: RegistrationDraftFields,
): RegistrationDraftFieldErrors {
  const schema = STEP_SCHEMAS[step];
  const stepValues = pickRegistrationDraftStepValues(step, fields);
  const parsed = schema.safeParse(stepValues);
  const fieldErrors = zodIssuesToFieldErrors(
    parsed.success ? [] : parsed.error.issues,
    STEP_FIELD_GROUPS[step],
  );

  if (step !== 'packages') {
    return fieldErrors;
  }

  const packageValidation = validateRegistrationDraftPackages(fields.suiPackages);
  return {
    ...fieldErrors,
    ...packageValidation.fieldErrors,
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

  const errors = validateRegistrationDraftStepFields(step, fields);
  return STEP_FIELD_GROUPS[step].every((fieldName) => !errors[fieldName]);
}
function pickRegistrationDraftStepValues(
  step: RegistrationDraftFieldStep,
  fields: RegistrationDraftFields,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const fieldName of STEP_FIELD_GROUPS[step]) {
    values[fieldName] = fields[fieldName];
  }
  return values;
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
