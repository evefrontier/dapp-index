import {
  type DappIndexSuiNetwork,
  type DappIndexSuiPackageRole,
} from '@/types/dapp-index';
import {
  RegistrationDraftPackageSchema,
  RegistrationDraftPackageStorageSchema,
} from '@/schemas/registration-draft-package';
import { zodIssuesToFieldErrors } from '@/schemas/zodFieldErrors';
import type {
  MoveRegistryResolvablePackage,
  MoveRegistryVerificationResult,
} from '@/chain/moveRegistry.types';

export type RegistrationDraftPackage = {
  draftPackageId: string;
  network: DappIndexSuiNetwork;
  role: DappIndexSuiPackageRole;
  mvrName: string;
  packageId: string;
  packageInfoId: string;
};

export type RegistrationDraftPackageFieldName = Exclude<
  keyof RegistrationDraftPackage,
  'draftPackageId'
>;

export type RegistrationDraftPackageErrors = Partial<
  Record<RegistrationDraftPackageFieldName, string>
>;

export type RegistrationDraftPackageValidation = {
  fieldErrors: {
    suiPackages?: string;
  };
  packageErrors: RegistrationDraftPackageErrors[];
};

export type RegistrationDraftPackageVerificationStatus =
  | 'idle'
  | 'verifying'
  | 'ready'
  | 'not-ready'
  | 'error';

export type RegistrationDraftPackageVerificationState = {
  status: RegistrationDraftPackageVerificationStatus;
  result: RegistrationDraftPackageVerificationResult | null;
  errorMessage: string | null;
};

export type RegistrationDraftPackageVerificationResult = {
  ok: boolean;
  results: MoveRegistryVerificationResult[];
};

export const INITIAL_REGISTRATION_DRAFT_PACKAGE_VERIFICATION: RegistrationDraftPackageVerificationState =
  {
    status: 'idle',
    result: null,
    errorMessage: null,
  };

const DEFAULT_PACKAGE_NETWORK: DappIndexSuiNetwork = 'testnet';
const DEFAULT_PACKAGE_ROLE: DappIndexSuiPackageRole = 'dependency';

const PACKAGE_FIELD_KEYS = [
  'network',
  'role',
  'mvrName',
  'packageId',
  'packageInfoId',
] as const satisfies readonly RegistrationDraftPackageFieldName[];

export function createRegistrationDraftPackage({
  draftPackageId,
  role = DEFAULT_PACKAGE_ROLE,
}: {
  draftPackageId: string;
  role?: DappIndexSuiPackageRole;
}): RegistrationDraftPackage {
  return {
    draftPackageId,
    network: DEFAULT_PACKAGE_NETWORK,
    role,
    mvrName: '',
    packageId: '',
    packageInfoId: '',
  };
}

export function addRegistrationDraftPackage(
  packages: readonly RegistrationDraftPackage[],
): RegistrationDraftPackage[] {
  return [
    ...packages,
    createRegistrationDraftPackage({
      draftPackageId: crypto.randomUUID(),
      role: getNewRegistrationDraftPackageDefaultRole(packages),
    }),
  ];
}

export function readRegistrationDraftPackages(
  fields: Record<string, unknown>,
): RegistrationDraftPackage[] {
  if (!Array.isArray(fields.suiPackages)) return [];

  const usedIds = new Set<string>();
  return fields.suiPackages.map((item, index) =>
    readRegistrationDraftPackage(item, index, usedIds),
  );
}

export function createRegistrationDraftPackagePatch(
  packages: readonly RegistrationDraftPackage[],
): Record<string, unknown> {
  return {
    suiPackages: packages.map((draftPackage) => ({ ...draftPackage })),
  };
}

export function validateRegistrationDraftPackages(
  packages: readonly RegistrationDraftPackage[],
): RegistrationDraftPackageValidation {
  const packageErrors = packages.map(validateRegistrationDraftPackage);
  const fieldErrors: RegistrationDraftPackageValidation['fieldErrors'] = {};

  if (packageErrors.some(hasRequiredPackageErrors)) {
    fieldErrors.suiPackages = 'Add a valid package ID for each package.';
  } else if (packageErrors.some(hasPackageErrors)) {
    fieldErrors.suiPackages = 'Fix optional MVR fields before verification.';
  }

  return { fieldErrors, packageErrors };
}

export function getRegistrationDraftPackageVerificationBlocker(
  packages: readonly RegistrationDraftPackage[],
): string | null {
  if (packages.length === 0) return 'Add a package before verification.';

  const packageValidation = validateRegistrationDraftPackages(packages);
  if (packageValidation.fieldErrors.suiPackages) {
    return packageValidation.fieldErrors.suiPackages;
  }

  return null;
}

export function toMoveRegistryResolvablePackages(
  packages: readonly RegistrationDraftPackage[],
): MoveRegistryResolvablePackage[] {
  return packages.map(
    ({ network, role, mvrName, packageId, packageInfoId }) => ({
      network,
      role,
      mvrName,
      packageId,
      packageInfoId,
    }),
  );
}

function validateRegistrationDraftPackage(
  draftPackage: RegistrationDraftPackage,
): RegistrationDraftPackageErrors {
  const result = RegistrationDraftPackageSchema.safeParse(draftPackage);
  if (result.success) return {};
  return zodIssuesToFieldErrors(result.error.issues, PACKAGE_FIELD_KEYS);
}

function readRegistrationDraftPackage(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): RegistrationDraftPackage {
  const parsed = RegistrationDraftPackageStorageSchema.safeParse(value);
  const stored = parsed.success
    ? parsed.data
    : RegistrationDraftPackageStorageSchema.parse({});
  const fallbackId = `package-${index + 1}`;
  const draftPackageId = uniqueDraftPackageId(
    stored.draftPackageId || fallbackId,
    fallbackId,
    usedIds,
  );

  return {
    ...stored,
    draftPackageId,
  };
}

function hasPackageErrors(errors: RegistrationDraftPackageErrors): boolean {
  return Object.keys(errors).length > 0;
}

function hasRequiredPackageErrors(
  errors: RegistrationDraftPackageErrors,
): boolean {
  return Boolean(errors.packageId);
}

function uniqueDraftPackageId(
  candidate: string,
  fallback: string,
  usedIds: Set<string>,
): string {
  let nextId = candidate || fallback;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${fallback}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(nextId);
  return nextId;
}

function getNewRegistrationDraftPackageDefaultRole(
  packages: readonly RegistrationDraftPackage[],
): DappIndexSuiPackageRole {
  return packages.some((draftPackage) => draftPackage.role === 'core')
    ? 'dependency'
    : 'core';
}
