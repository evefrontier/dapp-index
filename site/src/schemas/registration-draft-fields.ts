import { z } from 'zod';
import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
} from '@/constants';
import {
  isHttpsUrlValue,
  OptionalHttpsUrlSchema,
  SlugSchema,
  storedString,
  storedUniqueEnumArray,
} from './shared';
import { RegistrationDraftPackagesSchema } from './registration-draft-package';

const CategorySchema = z.enum(
  DAPP_INDEX_CATEGORIES.map((category) => category.id) as [
    (typeof DAPP_INDEX_CATEGORIES)[number]['id'],
    ...(typeof DAPP_INDEX_CATEGORIES)[number]['id'][],
  ],
);

const SmartAssemblyTypeSchema = z.enum(
  DAPP_INDEX_SMART_ASSEMBLY_TYPES.map((assembly) => assembly.id) as [
    (typeof DAPP_INDEX_SMART_ASSEMBLY_TYPES)[number]['id'],
    ...(typeof DAPP_INDEX_SMART_ASSEMBLY_TYPES)[number]['id'][],
  ],
);

const ServerTenantSchema = z.enum(DAPP_INDEX_SERVER_TENANTS);

export const RegistrationDraftBasicsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(80, 'Name must be 80 characters or fewer.'),
  slug: SlugSchema,
  summary: z
    .string()
    .trim()
    .min(1, 'Summary is required.')
    .max(180, 'Summary must be 180 characters or fewer.'),
});

export const RegistrationDraftAboutSchema = z.object({
  description: z
    .string()
    .max(4000, 'Description must be 4000 characters or fewer.'),
  tribe: z.string().max(80, 'Tribe must be 80 characters or fewer.'),
  riderName: z.string().max(80, 'Rider name must be 80 characters or fewer.'),
  liveUrl: z
    .string()
    .trim()
    .min(1, 'Live URL is required.')
    .refine((value) => isHttpsUrlValue(value), 'Use an HTTPS URL.'),
  repositoryUrl: OptionalHttpsUrlSchema,
  documentationUrl: OptionalHttpsUrlSchema,
});

export const RegistrationDraftDiscoverySchema = z.object({
  categories: z
    .array(CategorySchema)
    .min(1, 'Choose at least one category.')
    .max(5, 'Choose no more than five categories.')
    .refine(
      (items) => new Set(items).size === items.length,
      'Choose valid categories.',
    ),
  smartAssemblyTypes: z
    .array(SmartAssemblyTypeSchema)
    .refine(
      (items) => new Set(items).size === items.length,
      'Choose valid smart assemblies.',
    ),
  serverTenant: z
    .string()
    .refine(
      (value): value is z.infer<typeof ServerTenantSchema> =>
        DAPP_INDEX_SERVER_TENANTS.includes(
          value as (typeof DAPP_INDEX_SERVER_TENANTS)[number],
        ),
      'Choose a server tenant.',
    ),
});

export const RegistrationDraftPackagesStepSchema = z.object({
  suiPackages: RegistrationDraftPackagesSchema,
});

export const RegistrationDraftFieldsSchema = RegistrationDraftBasicsSchema.merge(
  RegistrationDraftAboutSchema,
).merge(RegistrationDraftDiscoverySchema).merge(RegistrationDraftPackagesStepSchema);

export type RegistrationDraftFieldsInput = z.input<
  typeof RegistrationDraftFieldsSchema
>;

const CATEGORY_IDS = DAPP_INDEX_CATEGORIES.map((category) => category.id) as [
  (typeof DAPP_INDEX_CATEGORIES)[number]['id'],
  ...(typeof DAPP_INDEX_CATEGORIES)[number]['id'][],
];

const SMART_ASSEMBLY_IDS = DAPP_INDEX_SMART_ASSEMBLY_TYPES.map(
  (assembly) => assembly.id,
) as [
  (typeof DAPP_INDEX_SMART_ASSEMBLY_TYPES)[number]['id'],
  ...(typeof DAPP_INDEX_SMART_ASSEMBLY_TYPES)[number]['id'][],
];

const StoredServerTenantSchema = z.preprocess(
  (value) =>
    typeof value === 'string' &&
    (DAPP_INDEX_SERVER_TENANTS as readonly string[]).includes(value)
      ? value
      : '',
  z.union([ServerTenantSchema, z.literal('')]),
);

export const RegistrationDraftFieldsStorageSchema = z.object({
  name: storedString(),
  slug: storedString(),
  summary: storedString(),
  description: storedString(),
  tribe: storedString(),
  riderName: storedString(),
  liveUrl: storedString(),
  repositoryUrl: storedString(),
  documentationUrl: storedString(),
  categories: storedUniqueEnumArray(CATEGORY_IDS),
  smartAssemblyTypes: storedUniqueEnumArray(SMART_ASSEMBLY_IDS),
  serverTenant: StoredServerTenantSchema,
});

export type RegistrationDraftFieldsStorage = z.infer<
  typeof RegistrationDraftFieldsStorageSchema
>;
