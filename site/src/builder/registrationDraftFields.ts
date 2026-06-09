import type { DraftStep } from '@/storage/draftStorage';
import {
  type DappIndexCategoryId,
  type DappIndexServerTenant,
  type DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import {
  RegistrationDraftAboutSchema,
  RegistrationDraftBasicsSchema,
  RegistrationDraftDiscoverySchema,
  RegistrationDraftFieldsSchema,
  RegistrationDraftFieldsStorageSchema,
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
  const stored = RegistrationDraftFieldsStorageSchema.parse(fields);

  return {
    ...stored,
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
