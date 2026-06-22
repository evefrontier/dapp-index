import { z } from 'zod';
import { isValidMvrName } from '@/chain/moveRegistry';
import {
  DAPP_INDEX_SUI_NETWORKS,
  DAPP_INDEX_SUI_PACKAGE_ROLES,
} from '@/constants';
import { storedEnumValue, storedString, SuiObjectIdSchema } from './shared';

const DEFAULT_PACKAGE_NETWORK = 'testnet' as const;
const DEFAULT_PACKAGE_ROLE = 'dependency' as const;

export const RegistrationDraftPackageStorageSchema = z.object({
  draftPackageId: storedString(),
  network: storedEnumValue(DAPP_INDEX_SUI_NETWORKS, DEFAULT_PACKAGE_NETWORK),
  role: storedEnumValue(DAPP_INDEX_SUI_PACKAGE_ROLES, DEFAULT_PACKAGE_ROLE),
  mvrName: storedString(),
  packageId: storedString(),
  packageInfoId: storedString(),
});

export type RegistrationDraftPackageStorage = z.infer<
  typeof RegistrationDraftPackageStorageSchema
>;

export const RegistrationDraftPackageSchema = z
  .object({
    draftPackageId: z.string(),
    network: z.enum(DAPP_INDEX_SUI_NETWORKS),
    role: z.enum(DAPP_INDEX_SUI_PACKAGE_ROLES),
    mvrName: z.string().trim().optional().default(''),
    packageId: z.string().trim().min(1, 'Package ID is required.'),
    packageInfoId: z.string().trim().optional().default(''),
  })
  .superRefine((draftPackage, context) => {
    if (!SuiObjectIdSchema.safeParse(draftPackage.packageId).success) {
      context.addIssue({
        code: 'custom',
        path: ['packageId'],
        message: 'Use a valid Sui object ID.',
      });
    }

    const mvrName = draftPackage.mvrName.trim();
    if (mvrName && !isValidMvrName(mvrName)) {
      context.addIssue({
        code: 'custom',
        path: ['mvrName'],
        message: 'Use a valid MVR name.',
      });
    }

    const packageInfoId = draftPackage.packageInfoId.trim();
    if (packageInfoId && !SuiObjectIdSchema.safeParse(packageInfoId).success) {
      context.addIssue({
        code: 'custom',
        path: ['packageInfoId'],
        message: 'Use a valid Sui object ID.',
      });
    }
  });

export const RegistrationDraftPackagesSchema = z.array(
  RegistrationDraftPackageSchema,
);

export type RegistrationDraftPackageInput = z.input<
  typeof RegistrationDraftPackageSchema
>;
